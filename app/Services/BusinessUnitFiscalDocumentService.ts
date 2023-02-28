import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Bill, { BillStatus } from 'App/Models/Bill';
import BusinessUnit from 'App/Models/BusinessUnit';
import BusinessUnitFiscalDocument, {
  BusinessUnitFiscalDocumentMovementType,
} from 'App/Models/BusinessUnitFiscalDocument';
import CorrectedFiscalDocument from 'App/Models/CorrectedFiscalDocument';
import IssuedFiscalDocument, {
  IssuedFiscalDocumentContingency,
} from 'App/Models/IssuedFiscalDocument';
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
      const unit = await BusinessUnit.findOrFail(unitId, {
        client: trx,
      });
      const bill = await Bill.query()
        .where('id', data.billId)
        .preload('client', query => {
          query.preload('tutor');
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

      if (issuedDocumentAlready) {
        throw new BadRequestException(
          'Documento já emitido',
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
        },
        {
          client: trx,
        },
      );

      const nfePayload: ISendNfe = {
        issuedAt: issuedDocument.authorizationDate.toISO(),
        purpose: '1',
        cnpj: unit.document ?? '',
        ie: '9097826436', // TODO fix
        seller: {
          location: {
            street: unit.address ?? '',
            number: unit.number ?? '',
            district: unit.district ?? '',
            city: unit.city ?? '',
            uf: unit.state ?? '',
            code: unit.postalCode ?? '',
          },
        },
        buyer: {
          name: bill.patient.name,
          document: bill.patient.tutor.document ?? '',
          phone: bill.patient.tutor.cellphone,
          location: {
            street: bill.patient.tutor.street ?? '',
            number: bill.patient.tutor.number ?? '',
            district: bill.patient.tutor.district ?? '',
            city: bill.patient.tutor.city ?? '',
            uf: bill.patient.tutor.state ?? '',
            code: bill.patient.tutor.postalCode ?? '',
          },
        },
        values: {
          base_icms: bill.icmsBase.toString(),
          icms_value: bill.icmsValue.toString(),
          icms_base_st: bill.icmsStBase.toString(),
          icms_total_value_st: bill.icmsStValue.toString(),

          ipi: bill.ipiValue.toString(),
          pis: bill.pisValue.toString(),
          cofins: bill.cofinsValue.toString(),

          product: bill.productValue.toString(),
          delivery: '0.0',
          discount: bill.discountValue.toString(),
          total: bill.totalValue.toString(),
          other: bill.otherValue.toString(),
        },
        items: bill.items.map((item, idx) => ({
          index: (idx + 1).toString(),
          code: item.product_variation_id,
          description: item.productVariation.product.description,
          cfop: item.fiscalOperationCode,

          quantity: item.quantity.toString(),

          value: item.unitaryValue.toString(),

          unity: item.productVariation.product.unit.name,

          total: item.totalValue.toString(),
          ncm: item.productVariation.product.ncm ?? '',
          icms_origin: item.productVariation.product.icmsOrigin,
          icms_base: item.icmsBase.toString(),
          icms_total_value: item.icmsValue.toString(),
          icms_base_st: item.icmsStBase.toString(),
          icms_total_value_st: item.icmsStValue.toString(),

          cst_icms: item.icmsCst,
          cst_pis: item.pisCst,
          cst_cofins: item.cofinsCst,
        })),
      };
      const error = await this.focusNfe.sendNfe(document.id, nfePayload);
      if (error) {
        throw new BadRequestException(error, 400, 'E_EXTERNAL_ERROR');
      }

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
