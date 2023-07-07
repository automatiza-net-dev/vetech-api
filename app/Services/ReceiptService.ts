import { inject } from '@adonisjs/fold';
import Database, {
  TransactionClientContract,
} from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import PaymentMethod, {
  PaymentMethodTef,
  PaymentMethodUsage,
} from 'App/Models/PaymentMethod';
import Product, { ProductPurpose } from 'App/Models/Product';
import ProductVariation from 'App/Models/ProductVariation';
import Receipt from 'App/Models/Receipt';
import ReceiptItem from 'App/Models/ReceiptItem';
import ReceiptPayment from 'App/Models/ReceiptPayment';
import TaxationGroup from 'App/Models/TaxationGroup';
import TaxationGroupRule, {
  MovementCategory,
  MovementType,
} from 'App/Models/TaxationGroupRule';
import UfIcms from 'App/Models/UfIcms';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import { DateTime } from 'luxon';

@inject()
export default class ReceiptService {
  constructor(private sharedService: SharedService) {}

  async createReceipt(
    authCtx: AuthContext,
    data: {
      supplierId: string;
      dailyMovementId?: string;
      dailyCashierId?: string;
      reversalUserId?: string;
      reversalReasonId?: string;
      receiptDate: DateTime;
      otherValue?: number;
      additionalInformation?: string;
      reversalObservation?: string;
      reversedAt?: DateTime;

      items: Array<{
        productVariationId: string;
        quantity: number;
        costValue: number;
        unitaryValue: number;
        discountValue: number;
      }>;
    },
  ) {
    await Database.transaction(async trx => {
      const receipt = await Receipt.create(
        {
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,
          supplier_id: data.supplierId,
          user_id: authCtx.user.id,
          seller_id: authCtx.user.id,
          daily_cashier_id: data.dailyCashierId,
          daily_movement_id: data.dailyMovementId,
          reversal_user_id: data.reversalUserId,
          reversal_reason_id: data.reversalReasonId,

          issueDate: DateTime.now(),
          receiptDate: data.receiptDate,
          otherValue: data.otherValue,
          additionalInformation: data.additionalInformation,
          reversalObservation: data.reversalObservation,
          reversedAt: data.reversedAt,
          status: 'Ativa',
        },
        { client: trx },
      );

      const tasks = data.items.map(elem => {
        return this.innerCreateItem(trx, authCtx, {
          receiptId: receipt.id,
          productVariationId: elem.productVariationId,
          quantity: elem.quantity,
          costValue: elem.costValue,
          unitaryValue: elem.unitaryValue,
          discountValue: elem.discountValue,
        });
      });

      const items = await Promise.all(tasks);
      await receipt
        .merge({
          productValue: this.sharedService.sum(
            items.map(elem => elem.totalValue),
          ),
          serviceValue: 0,
          discountValue: this.sharedService.sum(
            items.map(elem => elem.discountValue),
          ),
          totalValue: this.sharedService.sum(
            items.map(elem => [elem.totalValue, -elem.discountValue]).flat(),
          ),
          deliveryValue: 0,

          icmsBase: this.sharedService.sum(items.map(elem => elem.icmsBase)),
          icmsValue: this.sharedService.sum(items.map(elem => elem.icmsValue)),
          icmsStBase: this.sharedService.sum(
            items.map(elem => elem.icmsStBase),
          ),
          icmsStValue: this.sharedService.sum(
            items.map(elem => elem.icmsStValue),
          ),
          icmsDeferredValue: this.sharedService.sum(
            items.map(elem => elem.icmsDeferredValue),
          ),
          icmsFcpValue: this.sharedService.sum(
            items.map(elem => elem.icmsFcpValue),
          ),
          icmsUfOriginValue: this.sharedService.sum(
            items.map(elem => elem.icmsPartitionOriginUfValue),
          ),
          icmsUfDestinationValue: this.sharedService.sum(
            items.map(elem => elem.icmsPartitionDestinationUfValue),
          ),

          issValue: this.sharedService.sum(items.map(elem => elem.issValue)),

          pisBase: this.sharedService.sum(items.map(elem => elem.pisBase)),
          pisValue: this.sharedService.sum(items.map(elem => elem.pisValue)),
          pisRetentionValue: this.sharedService.sum(
            items.map(elem => elem.pisRetentionValue),
          ),

          cofinsBase: this.sharedService.sum(
            items.map(elem => elem.cofinsBase),
          ),
          cofinsValue: this.sharedService.sum(
            items.map(elem => elem.cofinsValue),
          ),
          cofinsRetentionValue: this.sharedService.sum(
            items.map(elem => elem.cofinsRetentionValue),
          ),

          ipiBase: this.sharedService.sum(items.map(elem => elem.ipiBase)),
          ipiValue: this.sharedService.sum(items.map(elem => elem.ipiValue)),
        })
        .useTransaction(trx)
        .save();
    });
  }

  async createItem(
    authCtx: AuthContext,
    data: {
      receiptId: number;
      productVariationId: string;
      quantity: number;
      costValue: number;
      unitaryValue: number;
      discountValue: number;
    },
  ) {
    await Database.transaction(async trx => {
      const receipt = await Receipt.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.receiptId)
        .first();

      if (!receipt) {
        throw this.sharedService.ResourceNotFound();
      }

      await this.innerCreateItem(trx, authCtx, data);
    });
  }

  private async innerCreateItem(
    trx: TransactionClientContract,
    authCtx: AuthContext,
    data: {
      receiptId: number;
      productVariationId: string;
      quantity: number;
      costValue: number;
      unitaryValue: number;
      discountValue: number;
    },
  ) {
    const productVariation = await ProductVariation.query()
      .useTransaction(trx)
      .where('id', data.productVariationId)
      .whereHas('businessUnitProducts', query => {
        query.where('businness_unit_id', authCtx.unit.id);
      })
      .preload('product')
      .preload('businessUnitProducts', query => {
        query.where('businness_unit_id', authCtx.unit.id);
      })
      .first();

    if (!productVariation) {
      throw new BadRequestException(
        'Não foi possível encontrar um preço para esse produto',
        400,
        'E_NO_VARIATION',
      );
    }

    const rule = await TaxationGroupRule.query()
      .useTransaction(trx)
      .whereHas('taxationGroup', query => {
        query.where('id', productVariation.product.taxation_group_id);
      })
      .where('movementType', MovementType.E)
      .where('movementCategory', MovementCategory.NE)
      .where('fromUf', authCtx.unit.state ?? '-')
      .where('toUf', authCtx.unit.state ?? '-')
      .preload('taxationGroup')
      .preload('taxOperation')
      .first();

    const ufIcms = await UfIcms.query()
      .useTransaction(trx)
      .where('origin_uf', rule?.toUf ?? '-')
      .where('destination_uf', rule?.toUf ?? '-')
      .first();

    const totalValue = data.unitaryValue * data.quantity - data.discountValue;
    const icmsBase =
      totalValue * ((100 - (rule?.icmsPercRedBaseCalculo ?? 0)) / 100);
    const icmsValue = (icmsBase * (rule?.icmsPerc ?? 0)) / 100;
    const icmsStBase_1 = icmsBase + (icmsBase * (rule?.ivaIcmsSt ?? 0)) / 100;
    const icmsStPercentageRedBase = rule?.ivaIcmsSt
      ? rule?.icmsPercRedBaseCalculoST
      : undefined;
    const icmsStBase_2 = rule?.ivaIcmsSt
      ? icmsStBase_1 - (icmsStBase_1 * (icmsStPercentageRedBase ?? 0)) / 100
      : 0;

    return ReceiptItem.create(
      {
        economic_group_id: authCtx.group.id,
        business_unit_id: authCtx.unit.id,
        product_variation_id: data.productVariationId,
        receipt_id: data.receiptId,

        quantity: data.quantity,
        costValue: data.costValue,
        unitaryValue: data.unitaryValue,
        discountValue: data.discountValue,
        totalValue: data.unitaryValue * data.quantity - data.discountValue,
        status: 'Ativo',
        issuedAt: DateTime.now(),

        tax_operation_id: rule?.tax_operation_id,
        fiscalOperationCode: rule?.taxOperation?.code,

        icmsOriginProduct: productVariation.product.icmsOrigin,
        icmsCst: rule?.icmsCst,
        icmsBase,
        icmsPercentage: rule?.icmsPerc,
        icmsValue,
        icmsDeferredValue: 0,
        icmsPercentageRedAliquot: rule?.icmsPercRedAliquota,
        icmsPercentageRedBase: rule?.icmsPercRedBaseCalculo,
        icmsStBase: this.sharedService.isValidNumber(rule?.ivaIcmsSt)
          ? icmsStBase_2
          : undefined,
        icmsStPercentageRedBase: rule?.icmsPercRedBaseCalculo,
        icmsStIva: rule?.icmsPercRedAliquota,
        icmsStPercentageUfDestination: ufIcms?.icmsPercentage,
        icmsStValue:
          this.sharedService.isValidNumber(rule?.ivaIcmsSt) && ufIcms
            ? icmsStBase_2 * (ufIcms.icmsPercentage / 100) - icmsValue
            : undefined,
        icmsPartitionValue: 0,
        icmsFcpPercentage: rule?.fcpPerc,
        icmsFcpValue: 0,
        icmsPartitionOriginUfPercentage: rule?.icmsPerc,
        icmsPartitionDestinationUfPercentage: ufIcms?.icmsPercentage,
        icmsPartitionInterUfPercentage: ufIcms?.icmsPercentage,

        issCst: rule?.icmsCst,
        issBase: icmsBase,
        issPercentage: rule?.icmsPerc,
        issValue: (icmsBase * (rule?.icmsPerc ?? 1)) / 100,

        pisCst: rule?.pisCst,
        pisBase: totalValue,
        pisPercentage: rule?.pisPerc,
        pisValue: (totalValue * (rule?.pisPerc ?? 1)) / 100,
        pisRetentionValue: 0,

        cofinsCst: rule?.cofinsCst,
        cofinsBase: totalValue,
        cofinsPercentage: rule?.cofinsPerc,
        cofinsValue: (totalValue * (rule?.cofinsPerc ?? 1)) / 100,
        cofinsRetentionValue: 0,

        ipiCst: rule?.ipiCst,
        ipiBase: 0,
        ipiPercentage: rule?.ipiPerc,
        ipiValue: 0,
      },
      {
        client: trx,
      },
    );
  }

  async storePayment(
    authCtx: AuthContext,
    data: {
      receiptId: number;
      items: {
        paymentMethodId: string;
        tefAcquirerId?: string;
        tefFlagId?: string;

        installments: number;
        installmentValue: number;
        issueDate: DateTime;
        expirationDate: DateTime;
        nsuDocument?: string;
      }[];
    },
  ) {
    await Database.transaction(async trx => {
      const receipt = await Receipt.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.receiptId)
        .preload('payments')
        .first();

      if (!receipt) {
        throw this.sharedService.ResourceNotFound();
      }

      const tasks = data.items.map((elem, index) => {
        return ReceiptPayment.create(
          {
            economic_group_id: authCtx.group.id,
            business_unit_id: authCtx.unit.id,
            receipt_id: data.receiptId,
            payment_method_id: elem.paymentMethodId,
            tef_acquirer_id: elem.tefAcquirerId,
            tef_flag_id: elem.tefFlagId,

            block: index + 1 + receipt.payments.length,
            blockInstallments: elem.installments,
            installmentValue: elem.installmentValue,
            issueDate: elem.issueDate,
            expirationDate: elem.expirationDate,
            nsuDocument: elem.nsuDocument,
            status: 'Ativo',
          },
          { client: trx },
        );
      });

      await Promise.all(tasks);

      // call finance thing
    });
  }

  async deleteItem(
    authCtx: AuthContext,
    data: {
      itemId: number;
    },
  ) {
    await Database.transaction(async trx => {
      const thing = await ReceiptItem.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.itemId)
        .first();

      if (!thing) {
        throw this.sharedService.ResourceNotFound('Item não encontrado');
      }

      await thing
        .merge({
          disabled_user_id: authCtx.user.id,
          disabledAt: DateTime.now(),
        })
        .useTransaction(trx)
        .save();

      // TODO call receipt update
    });
  }

  async deletePayment(
    authCtx: AuthContext,
    data: {
      paymentId: number;
    },
  ) {
    await Database.transaction(async trx => {
      const thing = await ReceiptPayment.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', data.paymentId)
        .first();

      if (!thing) {
        throw this.sharedService.ResourceNotFound('Item não encontrado');
      }

      // TODO call finance thing

      await thing.useTransaction(trx).delete();
    });
  }

  async searchProducts(
    authCtx: AuthContext,
    data: {
      variation?: string;
      reference?: string;
      barcode?: string;
      description?: string;
    },
  ) {
    const qb = Product.query()
      .where('economic_group_id', authCtx.group.id)
      .whereNotIn('purpose', [ProductPurpose.INTERNAL])
      .where('active', true);

    if (data.variation || data.barcode) {
      qb.whereHas('variations', query => {
        if (data.variation) {
          query.where('id', data.variation);
        }
        if (data.barcode) {
          query.where('barcode', 'ilike', `%${data.barcode}%`);
        }
      });
    }

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.reference) {
      qb.where('referenceCode', 'ilike', `%${data.reference}%`);
    }

    qb.preload('variations', query => {
      if (data.variation) {
        query.where('id', data.variation);
      }
      if (data.barcode) {
        query.where('barcode', 'ilike', `%${data.barcode}%`);
      }

      query.where('active', true);
      query.preload('variationOptions');
      query.preload('product', query => {
        query.preload('unit');
      });

      query.preload('businessUnitProducts', query => {
        query.where('business_unit_id', authCtx.unit.id);
      });
    });

    const products = await qb;

    const variations = products.map(p => p.variations).flat();

    return variations.map(elem => ({
      id: elem.id,
      description: elem.product.description,
      unit: elem.product.unit,
      stock:
        elem.businessUnitProducts.find(
          p => p.businness_unit_id === authCtx.unit.id,
        )?.stock ?? null,
      costPrice:
        elem.businessUnitProducts.find(
          p => p.businness_unit_id === authCtx.unit.id,
        )?.costPrice ?? null,
      referenceCode: elem.product.referenceCode,
      barcode: elem.barcode,
      variationOptions: elem.variationOptions,
    }));
  }

  async searchTax(
    authCtx: AuthContext,
    data: {
      origin?: string;
      destination?: string;
      variation?: string;
    },
  ) {
    const qb = TaxationGroup.query()
      .where('economic_group_id', authCtx.group.id)
      .where('active', true);

    if (data.origin) {
      qb.whereHas('rules', query => {
        query.where('from_uf', data.origin as string);
      });
    }

    qb.whereHas('rules', query => {
      query.where('to_uf', data.destination ?? authCtx.unit.state ?? '-');
    });

    qb.whereHas('rules', query => {
      query.where('movement_type', MovementType.E);
    });

    qb.whereHas('rules', query => {
      query.where('movement_category', MovementCategory.NE);
    });

    qb.preload('rules', query => {
      query.preload('taxOperation');

      query.where('active', true);
      query.where('movement_type', MovementType.E);
      query.where('movement_category', MovementCategory.NE);

      if (data.origin) {
        query.where('from_uf', data.origin);
      }

      if (data.destination) {
        query.where('to_uf', data.destination);
      }
    });

    const result = await qb;

    return result
      .map(tax => tax.rules)
      .flat()
      .map(elem => ({
        idOperacaoFiscal: elem.tax_operation_id,
        codOperacaoFiscal: elem.taxOperation?.code ?? null,
        codBeneficioFiscal: elem.taxBenefitCode,
        icmsCst: elem.icmsCst,
        icmsPerc: elem.icmsPerc,
        icmsPercRedAliquota: elem.icmsPercRedAliquota,
        icmsPercRedBaseCalculo: elem.icmsPercRedBaseCalculo,
        ivaIcmsSt: elem.ivaIcmsSt,
        icmsPercRedBaseCalculoST: elem.icmsPercRedBaseCalculoST,
        icmsPercDiferimento: elem.icmsPercDiferimento,
        ipiCst: elem.ipiCst,
        ipiPerc: elem.ipiPerc,
        pisCst: elem.pisCst,
        pisPerc: elem.pisPerc,
        cofinsCst: elem.cofinsCst,
        cofinsPerc: elem.cofinsPerc,
      }));
  }

  async searchPaymentMethods(authCtx: AuthContext) {
    const result = await PaymentMethod.query()
      .where('economic_group_id', authCtx.group.id)
      .where('active', true)
      .whereIn('usage', [PaymentMethodUsage.RECEBER, PaymentMethodUsage.AMBOS])
      .preload('flags', query => {
        query.preload('flag');
        query.preload('acquirer');
      })
      .preload('fees');

    return result.map(elem => {
      if (elem.tef === PaymentMethodTef.N) {
        return {
          id: elem.id,
          description: elem.description,
          requiresDocument: elem.requiresDocument,
          daysFirstInstallment: elem.daysFirstInstallment,
          daysBetweenInstallments: elem.daysBetweenInstallments,
          allowChangeExpirationDate: elem.allowChangeExpirationDate,
        };
      }

      return {
        id: elem.id,
        description: elem.description,
        requiresDocument: elem.requiresDocument,
        daysFirstInstallment: elem.daysFirstInstallment,
        daysBetweenInstallments: elem.daysBetweenInstallments,
        allowChangeExpirationDate: elem.allowChangeExpirationDate,
        type: elem.type,
        flags: elem.flags.map(elem => {
          return {
            id: elem.id,
            flagId: elem.flag.id,
            acquirerId: elem.acquirer.id,
          };
        }),
        fees: elem.fees.map(elem => {
          return {
            id: elem.id,
            fee: elem.fee,
            installments: elem.installments,
          };
        }),
      };
    });
  }
}
