import { inject } from '@adonisjs/fold';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Bill, { BillStatus } from 'App/Models/Bill';
import BillItem from 'App/Models/BillItem';
import BusinessUnit from 'App/Models/BusinessUnit';
import BusinessUnitFiscalDocument, {
  BusinessUnitFiscalDocumentMovementType,
} from 'App/Models/BusinessUnitFiscalDocument';
import CorrectedFiscalDocument from 'App/Models/CorrectedFiscalDocument';
import IssuedFiscalDocument, {
  IssuedFiscalDocumentContingency,
} from 'App/Models/IssuedFiscalDocument';
import { PaymentMethodTef } from 'App/Models/PaymentMethod';
import { ProductType } from 'App/Models/Product';
import ServiceIssuedFiscalDocument from 'App/Models/ServiceIssuedFiscalDocument';
import User from 'App/Models/User';
import FocusNfeService, {
  disableWebhookResponseSchema,
  ISendNfe,
  nfeResponseSchema,
  nfseResponseSchema,
} from 'App/Services/FocusNfeService';
import SharedService from 'App/Services/SharedService';
import IBusinessUnitFiscalDocumentData, {
  IAuthorizeFiscalDocument,
  IAuthorizeNfseFiscalDocument,
  ICancelFiscalDocument,
  ICorrectFiscalDocument,
  IDisableFiscalDocument,
} from 'Contracts/interfaces/IBusinessUnitFiscalDocumentData';
import { DateTime } from 'luxon';
import { z } from 'zod';

interface ISearch {
  unit?: string;
  type?: BusinessUnitFiscalDocumentMovementType;
  bill?: string;
  active?: string;
  document?: string;
}

interface ISearchDocument {
  document?: string;
  movement?: string;
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

    if (data.document) {
      const isSingle = !data.document.includes(',');
      const tokens = data.document.split(',');

      if (isSingle) {
        qb.where('document_type', data.document);
      } else {
        qb.whereIn('document_type', tokens);
      }
    }

    if (data.movement) {
      const isSingle = !data.movement.includes(',');
      const tokens = data.movement.split(',');

      if (isSingle) {
        qb.where('movement_type', data.movement);
      } else {
        qb.whereIn('movement_type', tokens);
      }
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
        items: bill.items
          .filter(i => i.productVariation.product.type === ProductType.PRODUCT)
          .map((item, idx) => {
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

      // await issuedDocument
      //   .merge({
      //     sefazMessage: result.message,
      //   })
      //   .useTransaction(trx)
      //   .save();

      return issuedDocument;
    });
  }

  async authorizeNfse(
    unitId: string,
    user: User,
    data: IAuthorizeNfseFiscalDocument,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const unit = await BusinessUnit.query()
        .useTransaction(trx)
        .where('id', unitId)
        .preload('unitConfig')
        .firstOrFail();

      const document = await BusinessUnitFiscalDocument.findOrFail(
        data.unitFiscalDocumentId,
        {
          client: trx,
        },
      );

      const bill = await Bill.query()
        .useTransaction(trx)
        .where('id', data.billId)
        .preload('client', query => {
          query.preload('tutor');
        })
        .firstOrFail();
      const items = await BillItem.query()
        .useTransaction(trx)
        .where('bill_id', bill.id)
        .where('nfe_issued', false)
        .whereHas('productVariation', query => {
          query.whereHas('product', query => {
            query.where('type', ProductType.SERVICE);
          });
        })
        .preload('productVariation', query => {
          query.preload('product');
        });

      if (items.length === 0) {
        throw new BadRequestException('Não existe documento para ser emitido');
      }

      const results = await Promise.all(
        items.map(async item => {
          const serviceDocument = await ServiceIssuedFiscalDocument.create(
            {
              economic_group_id: group.id,
              business_unit_id: unitId,
              bill_id: data.billId,
              fiscal_document_id: document.id,
              user_who_authorized_id: user.id,
              authorizationDate: DateTime.now(),
              bill_item_id: item.id,
              model: document.model,
            },
            {
              client: trx,
            },
          );

          const result = await this.focusNfe.sendNfse(serviceDocument.id, {
            issuedAt: DateTime.now().toISO(),
            simple: unit.simple,
            seller: {
              document: unit.document ?? '',
              city_ie: unit.cityRegistration ?? '',
              city_code: unit.cityCode ?? '',
            },
            buyer: {
              cpf_document: bill.client.tutor.document ?? '',
              cnpj_document:
                bill.client.tutor.document?.length === 14
                  ? bill.client.tutor.document
                  : null,
              name: bill.client.name,
              email: bill.client.tutor.email,
              phone: bill.client.tutor.telephone ?? '',
              address: {
                street: bill.client.tutor.street ?? '',
                number: bill.client.tutor.number ?? '',
                district: bill.client.tutor.district ?? '',
                city_code: bill.client.tutor.cityCode ?? '',
                uf: bill.client.tutor.state ?? '',
                postal_code: bill.client.tutor.postalCode ?? '',
                complement: bill.client.tutor.complement ?? null,
              },
            },
            service: {
              total_value: item.totalValue,
              pis_value: item.pisValue,
              cofins_value: item.cofinsValue,
              iss_value: item.issValue,
              base_value: item.issBase,
              percentage_value: item.issPercentage,
              discount_value: item.discountValue,
              service_code: item.productVariation.product.serviceCode ?? '',
              cnae: unit.cnae ?? '',
              description: item.productVariation.product.description,
              city_code: unit.cityCode ?? '',
            },
          });

          await serviceDocument
            .merge({
              rpsNumber: result.data?.numero_rps,
              rpsSeries: result.data?.serie_rps,
              status: result.data?.status,
              errors: result.data?.erros,
            })
            .useTransaction(trx)
            .save();

          await item
            .merge({
              nfeIssued: result.success,
            })
            .useTransaction(trx)
            .save();

          return result;

          // did not work ? :\
        }),
      );

      console.log(JSON.stringify(results, undefined, 2));
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

      await this.mergeNfe(document, result).useTransaction(trx).save();
    });
  }

  async updateNfseFromFocus(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const document = await ServiceIssuedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('id', id)
        .first();

      if (!document) {
        throw this.sharedService.ResourceNotFound();
      }

      const result = await this.focusNfe.getNfse(document.id);
      if (!result) {
        throw new BadRequestException(
          'Erro ao atualizar nova',
          400,
          'E_NO_NOTE',
        );
      }

      await this.mergeNfse(document, result).useTransaction(trx).save();
    });
  }

  async updateFromFocusWithWebhook(id: string) {
    return Database.transaction(async trx => {
      const document = await IssuedFiscalDocument.query({
        client: trx,
      })
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

      await this.mergeNfe(document, result).useTransaction(trx).save();
    });
  }

  async updateNfseFromFocusWithWebhook(id: string) {
    return Database.transaction(async trx => {
      const document = await ServiceIssuedFiscalDocument.query({
        client: trx,
      })
        .where('id', id)
        .first();

      if (!document) {
        throw this.sharedService.ResourceNotFound();
      }

      const result = await this.focusNfe.getNfse(document.id);
      if (!result) {
        throw new BadRequestException(
          'Erro ao atualizar nova',
          400,
          'E_NO_NOTE',
        );
      }

      await this.mergeNfse(document, result).useTransaction(trx).save();
    });
  }

  async disableFromWebhook(data: unknown) {
    const result = disableWebhookResponseSchema.safeParse(data);
    Logger.info(JSON.stringify(data, undefined, 2));

    if (!result.success) {
      Logger.error('invalid body');
      Logger.error(JSON.stringify(result.error.issues, undefined, 2));
      return;
    }

    await Database.transaction(async trx => {
      const issuedDocument = await IssuedFiscalDocument.query()
        .useTransaction(trx)
        .where('model', result.data.modelo)
        .where('series', result.data.serie)
        .where('sequence', result.data.numero_inicial)
        .whereHas('unit', query => {
          query.where('document', result.data.cnpj);
        })
        .first();
      if (!issuedDocument) {
        Logger.error('documento não encontrado');
        return;
      }

      await issuedDocument
        .merge({
          sefazStatus: 'Inutilizado',
          sefazStatusCode: result.data.status_sefaz,
          sefazMessage: result.data.mensagem_sefaz,
          disablingXmlPath: result.data.caminho_xml,
          disablingReceipt: issuedDocument.disablingReceipt
            ? issuedDocument.disablingReceipt
            : result.data.protocolo_sefaz,
          disablingReceiptDate: issuedDocument.disablingReceiptDate
            ? issuedDocument.disablingReceiptDate
            : DateTime.now(),
        })
        .useTransaction(trx)
        .save();
    });
  }

  async cancelNfe(unitId: string, user: User, data: ICancelFiscalDocument) {
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

      const cancelResult = await this.focusNfe.cancelNfe(
        document.id,
        data.reason,
      );
      if (!cancelResult) {
        throw new BadRequestException(
          'Erro ao cancelar nota fiscal',
          400,
          'E_EXTERNAL_ERROR',
        );
      }

      // const getResult = await this.focusNfe.getNfe(document.id);
      // if (!getResult) {
      //   throw new BadRequestException(
      //     'Erro ao atualizar nova',
      //     400,
      //     'E_NO_NOTE',
      //   );
      // }

      await document
        .merge({
          user_who_cancelled_id: user.id,
          cancellationDate: DateTime.now(),
          cancellationReason: data.reason,

          // sefazStatus: cancelResult.status_sefaz,
          // sefazMessage: cancelResult.mensagem_sefaz,
          // cancellationXmlPath: cancelResult.caminho_xml_cancelamento,
          // cancellationReceiptDate: getResult.protocolo_cancelamento
          //   ? DateTime.fromISO(getResult.protocolo_cancelamento.data_evento)
          //   : undefined,
          // cancellationReceipt:
          //   getResult.protocolo_cancelamento?.numero_protocolo,
        })
        .useTransaction(trx)
        .save();
    });
  }

  async cancelNfse(unitId: string, user: User, data: ICancelFiscalDocument) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const document = await ServiceIssuedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('id', data.issuedDocumentId)
        .preload('billItem')
        .first();

      if (!document) {
        throw this.sharedService.ResourceNotFound();
      }

      const cancelResult = await this.focusNfe.cancelNfse(
        document.id,
        data.reason,
      );
      if (!cancelResult) {
        throw new BadRequestException(
          'Erro ao cancelar nota fiscal',
          400,
          'E_EXTERNAL_ERROR',
        );
      }

      await document.billItem
        .merge({
          nfeIssued: cancelResult.status !== 'cancelado',
        })
        .useTransaction(trx)
        .save();

      console.log(cancelResult);

      await document
        .merge({
          status: cancelResult.status,
          user_who_cancelled_id: user.id,
          cancellationDate:
            cancelResult.status === 'cancelado' ? DateTime.now() : undefined,
          cancellationReason:
            cancelResult.status === 'cancelado' ? data.reason : undefined,
          // @ts-expect-error json asd
          errors: JSON.stringify(data.erros),

          // sefazStatus: cancelResult.status_sefaz,
          // sefazMessage: cancelResult.mensagem_sefaz,
          // cancellationXmlPath: cancelResult.caminho_xml_cancelamento,
          // cancellationReceiptDate: getResult.protocolo_cancelamento
          //   ? DateTime.fromISO(getResult.protocolo_cancelamento.data_evento)
          //   : undefined,
          // cancellationReceipt:
          //   getResult.protocolo_cancelamento?.numero_protocolo,
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
        !!document.accessKey || // 2.16.5.2
        !!document.authorizationReceipt || // 2.16.5.3
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

      if (!result.success) {
        throw new BadRequestException(
          'Erro ao cancelar nota fiscal',
          400,
          'E_EXTERNAL_ERROR',
        );
      }

      await document
        .merge({
          sefazStatus: 'Inutilizado',
          user_who_disabled_id: user.id,
          disablingDate: DateTime.now(),
          disablingReason: data.reason,
          disablingReceiptDate: DateTime.now(),
          disablingReceipt: result.data?.protocolo_sefaz,
          // sefazStatus: result.status_sefaz,
          // sefazMessage: result.mensagem_sefaz,
          // disablingXmlPath: result.caminho_xml,
          // disablingReceipt: result.protocolo_sefaz,
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

  private mergeNfe(
    document: IssuedFiscalDocument,
    data: z.infer<typeof nfeResponseSchema>,
  ) {
    console.log('document:', document.toJSON());
    console.log('focus payload', data);

    return document.merge({
      sefazStatus:
        document.sefazStatus === 'Inutilizado'
          ? document.sefazStatus
          : data.status,
      sefazStatusCode: data.status_sefaz,
      sefazMessage: data.protocolo_cancelamento
        ? [
            data.protocolo_cancelamento.descricao_evento,
            data.protocolo_cancelamento.motivo,
          ].join(' - ')
        : data.mensagem_sefaz,
      accessKey: data.chave_nfe,
      authorizationXmlPath: data.caminho_xml_nota_fiscal,
      authorizationPdfPath: data.caminho_danfe,
      cancellationXmlPath: data.caminho_xml_cancelamento,

      authorizationReceipt: data.protocolo_nota_fiscal?.numero_protocolo,
      authorizationReceiptDate: data.protocolo_nota_fiscal?.data_recebimento
        ? DateTime.fromISO(data.protocolo_nota_fiscal?.data_recebimento)
        : undefined,

      cancellationReceipt: data.protocolo_cancelamento?.numero_protocolo,
      cancellationReceiptDate: data.protocolo_cancelamento?.data_evento
        ? DateTime.fromISO(data.protocolo_cancelamento?.data_evento)
        : undefined,
    });
  }

  private mergeNfse(
    document: ServiceIssuedFiscalDocument,
    data: z.infer<typeof nfseResponseSchema>,
  ) {
    console.log('document:', document.toJSON());
    console.log('focus nfse payload', data);

    return document.merge({
      status: data.status,
      sequence: data.numero,
      rpsNumber: data.numero_rps,
      rpsSeries: data.serie_rps,
      rpsType: data.tipo_rps,
      verificationCode: data.codigo_verificacao,
      // @ts-expect-error json asd
      errors: JSON.stringify(data.erros),
      authorizationDate:
        data.status === 'autorizado' ? DateTime.now() : undefined,
      cancellationDate:
        data.status === 'cancelado' ? DateTime.now() : undefined,
      mirrorPath: data.url,
      authorizationPdfPath: data.url_danfse,
      authorizationXmlPath: data.caminho_xml_nota_fiscal,
    });
  }
}
