import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Bill, { BillStatus } from 'App/Models/Bill';
import BusinessUnit from 'App/Models/BusinessUnit';
import BusinessUnitFiscalDocument, {
  BusinessUnitFiscalDocumentMovementType,
} from 'App/Models/BusinessUnitFiscalDocument';
import CorrectedFiscalDocument from 'App/Models/CorrectedFiscalDocument';
import { FiscalDocumentMovementType } from 'App/Models/FiscalDocument';
import IssuedFiscalDocument, {
  IssuedFiscalDocumentContingency,
} from 'App/Models/IssuedFiscalDocument';
import { PaymentMethodTef } from 'App/Models/PaymentMethod';
import User from 'App/Models/User';
import FocusNfeService, { ISendNfe } from 'App/Services/FocusNfeService';
import SharedService from 'App/Services/SharedService';
import IBusinessUnitFiscalDocumentData, {
  IAuthorizeFiscalDocument,
  ICancelFiscalDocument,
  ICorrectFiscalDocument,
  IDisableFiscalDocument,
} from 'Contracts/interfaces/IBusinessUnitFiscalDocumentData';
import { DateTime } from 'luxon';

interface ISearch {
  unit?: string;
  type?: BusinessUnitFiscalDocumentMovementType;
  bill?: string;
  active?: string;
  document?: string;
}

interface ISearchDocument {
  movement?: BusinessUnitFiscalDocumentMovementType;
  type?: FiscalDocumentMovementType;
}

@inject()
export default class BusinessUnitFiscalDocumentService {
  constructor(
    private sharedService: SharedService,
    private focusNfe: FocusNfeService,
  ) {}

  async index(unitId: string, data: ISearch) {
    const qb = IssuedFiscalDocument.query().where(
      'business_unit_id',
      data.unit ?? unitId,
    );

    if (data.type) {
      qb.where('movement_type', data.type);
    }

    if (data.document) {
      qb.where('fiscal_document_id', data.document);
    }

    if (data.bill) {
      qb.where('bill_id', data.bill);
    }

    if (data.active) {
      qb.where('active', data.active === 'true');
    }

    qb.preload('corrections');

    return qb;
  }

  async search(unitId: string, data: ISearchDocument) {
    const qb = BusinessUnitFiscalDocument.query()
      .debug(true)
      .where('business_unit_id', unitId);

    qb.whereIn('movement_type', [
      data.movement ? data.movement : '',
      FiscalDocumentMovementType.A,
    ]);

    if (data.type) {
      qb.where('document_type', data.type);
    }

    return qb;
  }

  async store(unitId: string, data: IBusinessUnitFiscalDocumentData) {
    const group = await this.sharedService.getUserGroup(unitId);

    return BusinessUnitFiscalDocument.create({
      economic_group_id: group.id,
      business_unit_id: unitId,

      documentType: data.type,
      movementType: data.movement,
      description: data.description,
      model: data.model,
      series: data.series,
      sequence: data.sequence,
    });
  }

  async authorize(unitId: string, user: User, data: IAuthorizeFiscalDocument) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const unit = await BusinessUnit.query()
        .useTransaction(trx)
        .where('id', unitId)
        .preload('unitConfig')
        .preload('acquirers')
        .firstOrFail();
      const bill = await Bill.query()
        .where('id', data.billId)
        .preload('client', query => {
          query.preload('tutor');
        })
        .preload('payments', query => {
          query.preload('paymentMethod');
          query.preload('flag');
        })
        .preload('items', query => {
          query.where('status', BillStatus.A);

          query.preload('productVariation', query => {
            query.preload('product', query => {
              query.preload('unit');
            });
          });
        })
        .useTransaction(trx)
        .firstOrFail();

      const issuedDocumentAlready = await IssuedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('bill_id', data.billId)
        .first();

      if (issuedDocumentAlready?.authorizationReceipt) {
        throw new BadRequestException(
          'Documento já autorizado',
          400,
          'E_ALREADY_ISSUED',
        );
      }

      if (bill.items.some(i => !i.tax_rule_id)) {
        throw new BadRequestException(
          'Item da Nota não tem imposto definido',
          400,
          'E_NO_TAX_RULE',
        );
      }

      const document = await BusinessUnitFiscalDocument.findOrFail(
        data.unitFiscalDocumentId,
        {
          client: trx,
        },
      );

      // before or after?
      await document
        .merge({
          sequence: document.sequence + 1,
        })
        .useTransaction(trx)
        .save();

      const issuedDocument = await IssuedFiscalDocument.create(
        {
          economic_group_id: group.id,
          business_unit_id: unitId,
          bill_id: data.billId,
          movementType: data.type,
          fiscal_document_id: document.id,
          model: document.model,
          series: document.series,
          sequence: document.sequence + 1,
          accessKeyRef: data.accessKeyRef,
          user_who_authorized_id: user.id,
          authorizationDate: DateTime.now(),
          contingency: IssuedFiscalDocumentContingency.N,
          active: true,
          purpose: 'Emissão', // TODO check
        },
        {
          client: trx,
        },
      );

      const nfePayload: ISendNfe = {
        nfe_series: issuedDocument.series,
        nfe_number: issuedDocument.sequence,
        issuedAt: issuedDocument.authorizationDate.minus({ hours: 3 }).toISO(),
        authorizedAt: issuedDocument.authorizationDate
          .minus({ hours: 3 })
          .toISO(),
        purpose: issuedDocument.purpose,

        seller: {
          cnpj: unit.document,
          name: unit.companyName,
          fantasy_name: unit.fantasyName,
          phone: unit.phone,
          city_ie: unit.cityRegistration,
          state_ie: unit.stateRegistration,
          cnae: unit.cnae,
          regime: unit.simple ? '1' : '3',
          location: {
            street: unit.address ?? '',
            number: unit.number ?? '',
            complement: unit.complement ?? '',
            district: unit.district ?? '',
            city: unit.city ?? '',
            uf: unit.state ?? '',
            code: unit.postalCode ?? '',
          },
        },
        buyer: {
          name: bill.client.name,
          cpf_document: bill.client.tutor.document ?? '',
          cnpj_document:
            bill.client.tutor.document?.length === 14
              ? bill.client.tutor.document
              : null,
          phone: bill.client.tutor.cellphone,
          ie: bill.client.tutor.inscription ?? '',
          email: bill.client.tutor.email,
          authorized: unit.unitConfig.xmlDownloadAuthorization ?? '',

          location: {
            street: bill.client.tutor.street ?? '',
            number: bill.client.tutor.number ?? '',
            complement: bill.client.tutor.complement ?? '',
            district: bill.client.tutor.district ?? '',
            city: bill.client.tutor.city ?? '',
            uf: bill.client.tutor.state ?? '',
            code: bill.client.tutor.postalCode ?? '',
          },
        },
        items: bill.items.map((item, idx) => {
          const result: ISendNfe['items'][number] = {
            index: (idx + 1).toString(),
            code: item.product_variation_id,
            barcode: item.productVariation.barcode,
            description: item.productVariation.product.description,
            ncm: item.productVariation.product.ncm ?? '',
            cest: item.productVariation.product.cest ?? '',
            tax_benefit_code: item.productVariation.product.taxBenefitCode,
            cfop: item.fiscalOperationCode,
            unity: item.productVariation.product.unit.tag,
            quantity: item.quantity.toString(),
            value: item.unitaryValue.toString(),
            discount: item.discountValue,

            icms_origin: item.productVariation.product.icmsOrigin,
            cst_icms: item.icmsCst,
            // icms_base: item.icmsBase,
            // icms_red_calc: item.icmsStPercentageRedBase,
            // icms_percentage: item.icmsPercentage,
            // icms_value: item.icmsValue,

            fcp_percentage: item.icmsFcpPercentage,
            fcp_base_calc: item.icmsBase,
            fcp_value: item.icmsFcpValue,

            cst_ipi: item.ipiValue > 0 ? item.ipiCst : null,
            ipi_base: item.ipiValue > 0 ? item.ipiBase : null,
            ipi_percentage: item.ipiValue > 0 ? item.ipiPercentage : null,
            ipi_value: item.ipiValue > 0 ? item.ipiValue : null,

            cst_pis: item.pisCst,
            pis_base: item.pisBase,
            pis_percentage: item.pisPercentage,
            pis_value: item.pisValue,

            cst_cofins: item.cofinsCst,
            cofins_base: item.cofinsBase,
            cofins_percentage: item.cofinsPercentage,
            cofins_value: item.cofinsValue,
          };

          if (
            ['10', '30', '70', '90', '201', '202', '203', '900'].includes(
              item.icmsCst,
            )
          ) {
            result.icms_st_modality = 4;
            result.icms_st_additional = item.icmsStIva;
            result.icms_st_red_calc = item.icmsStPercentageRedBase;
            result.icms_st_base = item.icmsStBase;
            result.icms_st_percentage = item.icmsStPercentageUfDestination;
            result.icms_st_value = item.icmsStValue;
          }

          if (
            ['00', '10', '20', '51', '60', '70', '90', '900'].includes(
              item.icmsCst,
            )
          ) {
            result.icms_modality = 3;
            result.icms_base = item.icmsBase;
            result.icms_percentage = item.icmsPercentage;
            result.icms_value = item.icmsValue;
          }

          if (['20', '70', '90', '900'].includes(item.icmsCst)) {
            result.icms_red_calc = item.icmsStPercentageRedBase;
          }

          return result;
        }),
        payments: bill.payments.map(item => ({
          nfe_code: item.paymentMethod.nfe_code,
          description:
            item.paymentMethod.nfe_code === '99'
              ? item.paymentMethod.description
              : null,
          installment: item.installmentValue,
          integration_type:
            // eslint-disable-next-line no-nested-ternary
            item.paymentMethod.tef === PaymentMethodTef.N
              ? null
              : item.paymentMethod.tef === PaymentMethodTef.T
              ? '1'
              : '2',
          acquirer:
            item.paymentMethod.tef === PaymentMethodTef.N
              ? null
              : unit.acquirers.find(a => a.id === item.tef_acquirer_id)
                  ?.document,
          flag: item.flag.nfe_code,
          nsu: item.nsuDocument,
        })),
        totalizers: {
          // icms_base: bill.icmsBase,
          // icms_total: bill.icmsValue,
          // fcp_total: bill.icmsFcpValue,
          // product_value: bill.productValue,
          delivery_value: bill.deliveryValue,
          // discount_value: bill.discountValue,
          // ipi_value: bill.ipiValue,
          // pis_value: bill.pisValue,
          // cofins_value: bill.cofinsValue,
          other_value: bill.otherValue,
        },
      };

      const result = await this.focusNfe.sendNfe(issuedDocument.id, nfePayload);
      if (!result.success) {
        throw new BadRequestException(result.message, 400, 'E_EXTERNAL_ERROR');
      }

      await issuedDocument
        .merge({
          sefazMessage: result.message,
        })
        .useTransaction(trx)
        .save();

      return issuedDocument;
    });
  }

  async updateFromFocus(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const document = await IssuedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('id', id)
        .first();

      if (!document) {
        throw this.sharedService.ResourceNotFound();
      }

      const result = await this.focusNfe.getNfe(document.id);
      if (!result) {
        throw new BadRequestException(
          'Erro ao atualizar nova',
          400,
          'E_NO_NOTE',
        );
      }

      return document
        .merge({
          sefazStatus: result.status_sefaz,
          sefazMessage: result.mensagem_sefaz,
          accessKey: result.chave_nfe,

          authorizationXmlPath: result.caminho_xml_nota_fiscal,
          authorizationPdfPath: result.caminho_danfe,

          cancellationXmlPath: result.caminho_xml_cancelamento,
        })
        .useTransaction(trx)
        .save();
    });
  }

  async cancel(unitId: string, user: User, data: ICancelFiscalDocument) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const document = await IssuedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('id', data.issuedDocumentId)
        .first();

      if (!document) {
        throw this.sharedService.ResourceNotFound();
      }

      if (
        !document.accessKey || // 2.15.5.1
        !document.authorizationReceipt || // 2.15.5.2
        !document.authorizationDate || // 2.15.5.3
        !!document.cancellationDate || // 2.15.5.4
        !!document.disablingReceipt // 2.15.5.5
      ) {
        throw new BadRequestException(
          'Documento em estado inválido',
          400,
          'E_INVALID_STATE',
        );
      }

      const cancelResult = await this.focusNfe.cancel(document.id, data.reason);
      if (!cancelResult) {
        throw new BadRequestException(
          'Erro ao cancelar nota fiscal',
          400,
          'E_EXTERNAL_ERROR',
        );
      }

      const getResult = await this.focusNfe.getNfe(document.id);
      if (!getResult) {
        throw new BadRequestException(
          'Erro ao atualizar nova',
          400,
          'E_NO_NOTE',
        );
      }

      await document
        .merge({
          user_who_cancelled_id: user.id,
          cancellationDate: DateTime.now(),
          cancellationReason: data.reason,

          sefazStatus: cancelResult.status_sefaz,
          sefazMessage: cancelResult.mensagem_sefaz,
          cancellationXmlPath: cancelResult.caminho_xml_cancelamento,
          cancellationReceiptDate: getResult.protocolo_cancelamento
            ? DateTime.fromISO(getResult.protocolo_cancelamento.data_evento)
            : undefined,
          cancellationReceipt:
            getResult.protocolo_cancelamento?.numero_protocolo,
        })
        .useTransaction(trx)
        .save();
    });
  }

  async disable(unitId: string, user: User, data: IDisableFiscalDocument) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const unit = await BusinessUnit.findOrFail(unitId);
      const document = await IssuedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('id', data.issuedDocumentId)
        .first();

      if (!document) {
        throw this.sharedService.ResourceNotFound();
      }

      if (
        !document.authorizationDate || // 2.16.5.1
        !!document.accessKey || // 2.16.5.2
        !!document.authorizationReceipt || // 2.16.5.3
        !!document.authorizationReceiptDate || // 2.16.5.4
        !!document.cancellationReceipt || // 2.16.5.5
        !!document.disablingReceipt // 2.16.5.6
      ) {
        throw new BadRequestException(
          'Documento em estado inválido',
          400,
          'E_INVALID_STATE',
        );
      }

      const result = await this.focusNfe.disable(document.id, {
        cnpj: unit.document ?? '',
        series: document.series,
        sequence: document.sequence.toString(),
        reason: data.reason,
      });

      if (!result) {
        throw new BadRequestException(
          'Erro ao cancelar nota fiscal',
          400,
          'E_EXTERNAL_ERROR',
        );
      }

      await document
        .merge({
          user_who_disabled_id: user.id,
          disablingDate: DateTime.now(),
          disablingReason: data.reason,

          sefazStatus: result.status_sefaz,
          sefazMessage: result.mensagem_sefaz,
          disablingXmlPath: result.caminho_xml,
          disablingReceipt: result.protocolo_sefaz,
        })
        .useTransaction(trx)
        .save();
    });
  }

  async correct(unitId: string, user: User, data: ICorrectFiscalDocument) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const document = await IssuedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('id', data.issuedDocumentId)
        .first();

      if (!document) {
        throw this.sharedService.ResourceNotFound();
      }

      if (
        !document.accessKey || // 2.17.5.1
        !document.authorizationReceipt || // 2.17.5.2
        !document.authorizationReceiptDate || // 2.17.5.3
        !!document.cancellationReceipt || // 2.17.5.4
        !!document.disablingReceipt // 2.17.5.5
      ) {
        throw new BadRequestException(
          'Documento em estado inválido',
          400,
          'E_INVALID_STATE',
        );
      }

      const count = await CorrectedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('fiscal_document_id', document.id);

      await CorrectedFiscalDocument.create(
        {
          economic_group_id: group.id,
          business_unit_id: unitId,
          fiscal_document_id: document.id,
          correctionNumber: (count.length + 1).toString(),
          user_id: user.id,
          correctedDate: DateTime.now(),
          description: data.reason,
        },
        {
          client: trx,
        },
      );

      // TODO call external service
    });
  }
}
