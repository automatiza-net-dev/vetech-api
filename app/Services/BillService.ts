import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import Bill, { BillStatus } from 'App/Models/Bill';
import BillItem, { BillItemStatus } from 'App/Models/BillItem';
import BillPayment, { BillPaymentFeeType } from 'App/Models/BillPayment';
import BusinessUnit from 'App/Models/BusinessUnit';
import DailyCashier, { DailyCashierStatus } from 'App/Models/DailyCashier';
import Finance, {
  FinanceAccept,
  FinanceOriginFlag,
  FinanceStatus,
  FinanceType,
} from 'App/Models/Finance';
import Patient from 'App/Models/Patient';
import PaymentMethod from 'App/Models/PaymentMethod';
import PaymentMethodFlagInstallment from 'App/Models/PaymentMethodFlagInstallment';
import Product, { ProductType } from 'App/Models/Product';
import ProductVariation from 'App/Models/ProductVariation';
import TaxationGroup from 'App/Models/TaxationGroup';
import TaxationGroupRule, {
  MovementCategory,
  MovementType,
} from 'App/Models/TaxationGroupRule';
import UfIcms from 'App/Models/UfIcms';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import { GenerateTag } from 'App/Utils/GenerateTag';
import {
  ICreateBillData,
  ICreateBillItemData,
  ICreateBillPaymentData,
  IUpdateBillItemData,
} from 'Contracts/interfaces/IBillData';
import { DateTime } from 'luxon';

interface ISearch {
  fromBill?: string;
  toBill?: string;
  status?: string;
  client?: string;
  patient?: string;
  tag?: string;
}

interface ISearchProduct {
  variation?: string;
  reference?: string;
  barcode?: string;
  description?: string;
  quantity?: string;
}

interface ISearchTax {
  origin?: string;
  destination?: string;
  variation?: string;
  type?: string;
  category?: string;
  groups?: Array<string>;
}

@inject()
export default class BillService {
  constructor(private sharedService: SharedService) {}

  async index(unitId: string, data: ISearch) {
    const qb = Bill.query().where('business_unit_id', unitId);

    if (data.fromBill) {
      qb.where('bill_date', '>=', data.fromBill);
    }

    if (data.toBill) {
      qb.where('bill_date', '<=', data.toBill);
    }

    if (data.status) {
      qb.where('status', data.status);
    }

    if (data.client) {
      qb.where('client_id', data.client);
    }

    if (data.patient) {
      qb.where('patient_id', data.patient);
    }

    if (data.tag) {
      qb.where('tag', 'ilike', `%${data.tag}%`);
    }

    qb.preload('client');
    qb.preload('patient');
    qb.preload('seller');
    qb.preload('user');
    qb.preload('items', query => {
      query.preload('productVariation', query => {
        query.preload('variationOptions');
        query.preload('product');
      });
    });

    return qb;
  }

  async show(unitId: string, id: string) {
    const qb = Bill.query().where('business_unit_id', unitId).where('id', id);

    const bill = await qb.first();

    if (!bill) {
      throw this.sharedService.ResourceNotFound();
    }

    await Promise.all([
      bill.load('client', query => {
        query.preload('tutor');
      }),
      bill.load('patient'),
      bill.load('seller'),
      bill.load('user'),
      bill.load('businessUnit'),
      bill.load('payments', query => {
        query.preload('acquirer', query => {
          query.select('id', 'description');
        });
        query.preload('flag', query => {
          query.select('id', 'description', 'code', 'type');
        });
        query.preload('paymentMethod');
      }),
      bill.load('items', query => {
        query.preload('taxRule', query => {
          query.select(['id']);
        });

        query.preload('productVariation', query => {
          query.preload('variationOptions');
          query.preload('product');
        });
      }),
    ]);

    return bill;
  }

  async createBill(unitId: string, user: User, data: ICreateBillData) {
    const group = await this.sharedService.getUserGroup(unitId);

    // if (ufIcms.length !== taxRules.length) {
    //   throw new InternalErrorException(
    //     'Não foi possível encontrar a alíquota de ICMS para a UF de origem e destino',
    //     500,
    //     'E_INTERNAL_ERROR',
    //   );
    // }

    return Database.transaction(async trx => {
      const unit = await BusinessUnit.findOrFail(unitId, {
        client: trx,
      });
      const client = await Patient.query()
        .useTransaction(trx)
        .where('id', data.clientId)
        .preload('tutor')
        .firstOrFail();

      const bills = await Bill.query().select('id');

      const productVariations = await ProductVariation.query()
        .useTransaction(trx)
        .whereIn(
          'id',
          data.items.map(item => item.productVariationId),
        )
        .preload('product')
        .preload('businessUnitProducts', query => {
          query.where('businness_unit_id', unitId);
        });

      const taxRules = await TaxationGroupRule.query()
        .useTransaction(trx)
        .whereHas('taxationGroup', query => {
          query.whereIn(
            'id',
            productVariations.map(item => item.product.taxation_group_id),
          );
        })
        .where('movementType', MovementType.S)
        .where('movementCategory', MovementCategory.NS)
        .where('fromUf', unit.state ?? '')
        .where('toUf', client.tutor.state ?? '')
        .preload('taxationGroup')
        .preload('taxOperation');

      const ufIcms = await UfIcms.query()
        .whereIn(
          'origin_uf',
          taxRules.map(rule => rule.toUf),
        )
        .whereIn(
          'destination_uf',
          taxRules.map(rule => rule.toUf),
        );

      const bill = await Bill.create(
        {
          economic_group_id: group.id,
          business_unit_id: unitId,
          user_id: user.id,
          seller_id: user.id,
          daily_movement_id: data.dailyMovementId,
          daily_cashier_id: data.dailyCashierId,
          budget_id: data.budgetId,

          client_id: data.clientId,
          patient_id: data.patientId,
          billDate: data.billDate,
          productValue: 0,
          serviceValue: 0,
          discountValue: 0,
          totalValue: 0,
          deliveryValue: 0,
          additionalInformation: data.additionalInformation,
          status: BillStatus.A,

          otherValue: 0,
          tag: GenerateTag(bills.length + 1),
        },
        {
          client: trx,
        },
      );

      const items = data.items.map(item => {
        const variation = productVariations.find(
          variation => variation.id === item.productVariationId,
        ) as ProductVariation;

        const rule = taxRules.find(
          rule => rule.taxationGroup.id === variation.product.taxation_group_id,
        );

        const price = variation.businessUnitProducts.find(
          bup => bup.businness_unit_id === unitId,
        );

        const ufIcmsRule = ufIcms.find(
          ufIcms =>
            ufIcms.originUf === rule?.toUf &&
            ufIcms.destinationUf === rule?.toUf,
        );

        const totalValue =
          item.unitaryValue * item.quantity - item.discountValue;
        const icmsBase =
          totalValue * ((100 - (rule?.icmsPercRedBaseCalculo ?? 0)) / 100);
        const icmsValue = (icmsBase * (rule?.icmsPerc ?? 0)) / 100;
        const icmsStBase_1 = rule?.ivaIcmsSt
          ? icmsBase + (icmsBase * rule.ivaIcmsSt) / 100
          : 0;
        const icmsStPercentageRedBase = rule?.ivaIcmsSt
          ? rule.icmsPercRedBaseCalculoST
          : undefined;
        const icmsStBase_2 = rule?.ivaIcmsSt
          ? icmsStBase_1 - (icmsStBase_1 * (icmsStPercentageRedBase ?? 0)) / 100
          : 0;

        return BillItem.create(
          {
            economic_group_id: group.id,
            business_unit_id: unitId,
            bill_id: bill.id,
            product_variation_id: item.productVariationId,
            tax_rule_id: rule?.id,

            quantity: item.quantity,
            costValue: price?.costPrice,
            saleValue: price?.price,
            unitaryValue: item.unitaryValue,
            discountValue: item.discountValue,
            totalValue,
            status: BillItemStatus.A,
            createdAt: bill.createdAt,

            fiscalOperationCode: rule?.taxOperation.code,
            icmsOriginProduct: variation.product.icmsOrigin,
            icmsCst:
              rule?.ivaIcmsSt && variation.product.type === ProductType.PRODUCT
                ? rule?.icmsCst
                : undefined,
            icmsBase:
              variation.product.type === ProductType.PRODUCT
                ? icmsBase
                : undefined,
            icmsPercentage:
              variation.product.type === ProductType.PRODUCT
                ? rule?.icmsPerc
                : undefined,
            icmsValue:
              variation.product.type === ProductType.PRODUCT
                ? icmsValue
                : undefined,
            icmsPercentageRedAliquot: rule?.icmsPercRedAliquota,
            icmsPercentageRedBase: rule?.icmsPercRedBaseCalculo,
            icmsStBase: rule?.ivaIcmsSt ? icmsStBase_2 : undefined,
            icmsStPercentageRedBase: rule?.ivaIcmsSt
              ? rule?.icmsPercRedBaseCalculoST
              : undefined,
            icmsStIva: rule?.ivaIcmsSt,
            icmsStPercentageUfDestination: rule?.ivaIcmsSt
              ? ufIcmsRule?.icmsPercentage
              : undefined,
            icmsStValue: rule?.ivaIcmsSt
              ? icmsStBase_2 * ((ufIcmsRule?.icmsPercentage ?? 100) / 100) -
                icmsValue
              : undefined,
            issCst:
              variation.product.type === ProductType.SERVICE
                ? rule?.icmsCst
                : undefined,
            issBase:
              variation.product.type === ProductType.SERVICE
                ? icmsBase
                : undefined,
            issPercentage:
              variation.product.type === ProductType.SERVICE
                ? rule?.icmsPercRedAliquota
                : undefined,
            issValue:
              variation.product.type === ProductType.SERVICE
                ? (icmsBase * (rule?.icmsPercRedAliquota ?? 0)) / 100
                : undefined,
            pisBase: totalValue,
            pisPercentage: rule?.pisPerc,
            pisValue: (totalValue * (rule?.pisPerc ?? 1)) / 100,
            pisRetentionValue: 0,
            cofinsBase: totalValue,
            cofinsPercentage: rule?.cofinsPerc,
            cofinsValue: (totalValue * (rule?.cofinsPerc ?? 1)) / 100,
            cofinsRetentionValue: 0,
            ipiCst: rule?.ipiCst,
            ipiBase: totalValue,
            ipiPercentage: rule?.ipiPerc,
            ipiValue: (totalValue * (rule?.ipiPerc ?? 1)) / 100,
            icmsDeferredValue: 0,
            icmsPartitionValue: 0,
            icmsFcpPercentage: rule?.fcpPerc,
            icmsFcpValue: (icmsBase * (rule?.fcpPerc ?? 0)) / 100,
            icmsPartitionOriginUfPercentage: rule?.icmsPerc,
            icmsPartitionDestinationUfPercentage: rule?.icmsPercRedAliquota,
            icmsPartitionInterUfPercentage: rule?.icmsPercRedAliquota,
          },
          {
            client: trx,
          },
        );
      });

      const validItems = await Promise.all(items);

      let totalProductValue = 0;
      let totalServiceValue = 0;
      validItems.forEach(item => {
        const variation = productVariations.find(
          p => p.id === item.product_variation_id,
        );

        if (variation?.product.type === ProductType.PRODUCT) {
          totalProductValue += item.totalValue;
        }
        if (variation?.product.type === ProductType.SERVICE) {
          totalServiceValue += item.totalValue;
        }
      });

      // const totalProductValue = validItems.reduce(
      //   (acc, item) => acc + (item.totalValue ?? 0),
      //   0,
      // );

      const totalDiscountValue = validItems.reduce(
        (acc, item) => acc + (item.discountValue ?? 0),
        0,
      );

      await bill
        .merge({
          productValue: totalProductValue,
          serviceValue: totalServiceValue,
          discountValue: totalDiscountValue,
          totalValue: totalProductValue + totalServiceValue,
          icmsBase: validItems
            .filter(i => Boolean(i.icmsBase))
            .reduce((acc, item) => acc + (item.icmsBase ?? 0), 0),
          icmsValue: validItems
            .filter(i => Boolean(i.icmsValue))
            .reduce((acc, item) => acc + item.icmsValue, 0),
          icmsStBase: validItems
            .filter(i => Boolean(i.icmsStBase))
            .reduce((acc, item) => acc + item.icmsStBase, 0),
          icmsStValue: validItems.reduce(
            (acc, item) => acc + (item.icmsStValue ?? 0),
            0,
          ),
          issBase: validItems.reduce(
            (acc, item) => acc + (item.issBase ?? 0),
            0,
          ),
          issValue: validItems.reduce(
            (acc, item) => acc + (item.issValue ?? 0),
            0,
          ),
          pisBase: validItems.reduce(
            (acc, item) => acc + (item.pisBase ?? 0),
            0,
          ),
          pisValue: validItems.reduce(
            (acc, item) => acc + (item.pisValue ?? 0),
            0,
          ),
          pisRetentionValue: validItems.reduce(
            (acc, item) => acc + (item.pisRetentionValue ?? 0),
            0,
          ),
          cofinsBase: validItems.reduce(
            (acc, item) => acc + (item.cofinsBase ?? 0),
            0,
          ),
          cofinsValue: validItems.reduce(
            (acc, item) => acc + (item.cofinsValue ?? 0),
            0,
          ),
          cofinsRetentionValue: validItems.reduce(
            (acc, item) => acc + (item.cofinsRetentionValue ?? 0),
            0,
          ),
          ipiBase: validItems.reduce(
            (acc, item) => acc + (item.ipiBase ?? 0),
            0,
          ),
          ipiValue: validItems.reduce(
            (acc, item) => acc + (item.ipiValue ?? 0),
            0,
          ),
          icmsDeferredValue: validItems.reduce(
            (acc, item) => acc + (item.icmsDeferredValue ?? 0),
            0,
          ),
          icmsFcpValue: validItems.reduce(
            (acc, item) => acc + (item.icmsFcpValue ?? 0),
            0,
          ),
          icmsUfDestinationValue: validItems.reduce(
            (acc, item) => acc + (item?.icmsPartitionDestinationUfValue ?? 0),
            0,
          ),
          icmsUfOriginValue: validItems.reduce(
            (acc, item) => acc + (item?.icmsPartitionOriginUfValue ?? 0),
            0,
          ),
        })
        .useTransaction(trx)
        .save();

      return bill;
    });
  }

  async createBillItem(unitId: string, data: ICreateBillItemData) {
    const group = await this.sharedService.getUserGroup(unitId);
    const unit = await BusinessUnit.findOrFail(unitId);

    const bill = await Bill.query()
      .where('id', data.billId)
      .preload('client', query => {
        query.preload('tutor');
      })
      .firstOrFail();
    const items = await bill
      .related('items')
      .query()
      .preload('productVariation', query => {
        query.preload('product');
      });

    const productVariation = await ProductVariation.query()
      .where('id', data.productVariationId)
      .whereHas('businessUnitProducts', query => {
        query.where('businness_unit_id', unitId);
      })
      .preload('product')
      .preload('businessUnitProducts', query => {
        query.where('businness_unit_id', unitId);
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
      .whereHas('taxationGroup', query => {
        query.where('id', productVariation.product.taxation_group_id);
      })
      .where('movementType', MovementType.S)
      .where('movementCategory', MovementCategory.NS)
      .where('fromUf', unit.state ?? '')
      .where('toUf', bill.client.tutor.state ?? '')
      .preload('taxationGroup')
      .preload('taxOperation')
      .first();

    if (!rule) {
      throw new BadRequestException(
        'Não existe regra de imposto válida',
        400,
        'E_NO_RULE',
      );
    }

    const ufIcms = await UfIcms.query()
      .where('origin_uf', rule.toUf)
      .where('destination_uf', rule.toUf)
      .first();
    // if (!ufIcms) {
    //   throw new InternalErrorException(
    //     'Não foi possível encontrar a alíquota de ICMS para a UF de origem e destino',
    //     500,
    //     'E_INTERNAL_ERROR',
    //   );
    // }

    const [price] = productVariation.businessUnitProducts;
    if (!price) {
      throw new InternalErrorException(
        'Não foi possível encontrar um preço para esse produto',
        500,
        'E_INTERNAL_ERROR',
      );
    }

    return Database.transaction(async trx => {
      const totalValue = data.unitaryValue * data.quantity - data.discountValue;
      const icmsBase = totalValue * ((100 - rule.icmsPercRedBaseCalculo) / 100);
      const icmsValue = (icmsBase * rule.icmsPerc) / 100;
      const icmsStBase_1 = icmsBase + (icmsBase * rule.ivaIcmsSt) / 100;
      const icmsStPercentageRedBase = rule.ivaIcmsSt
        ? rule.icmsPercRedBaseCalculoST
        : undefined;
      const icmsStBase_2 = rule.ivaIcmsSt
        ? icmsStBase_1 - (icmsStBase_1 * (icmsStPercentageRedBase ?? 0)) / 100
        : 0;

      const billItem = await BillItem.create(
        {
          economic_group_id: group.id,
          business_unit_id: unitId,
          bill_id: bill.id,
          product_variation_id: data.productVariationId,
          tax_rule_id: rule.id,

          quantity: data.quantity,
          costValue: price.costPrice,
          saleValue: price.price,
          unitaryValue: data.unitaryValue,
          discountValue: data.discountValue,
          totalValue,
          status: BillItemStatus.A,
          createdAt: bill.createdAt,

          fiscalOperationCode: rule.taxOperation.code,
          icmsOriginProduct: productVariation.product.icmsOrigin,
          icmsCst:
            rule.ivaIcmsSt &&
            productVariation.product.type === ProductType.PRODUCT
              ? rule.icmsCst
              : undefined,
          icmsBase:
            productVariation.product.type === ProductType.PRODUCT
              ? icmsBase
              : undefined,
          icmsPercentage:
            productVariation.product.type === ProductType.PRODUCT
              ? rule.icmsPerc
              : undefined,
          icmsValue:
            productVariation.product.type === ProductType.PRODUCT
              ? icmsValue
              : undefined,
          icmsPercentageRedAliquot: rule.icmsPercRedAliquota,
          icmsPercentageRedBase: rule.icmsPercRedBaseCalculo,
          icmsStBase: rule.ivaIcmsSt ? icmsStBase_2 : undefined,
          icmsStPercentageRedBase: rule?.ivaIcmsSt
            ? rule.icmsPercRedBaseCalculoST
            : undefined,
          icmsStIva: rule.ivaIcmsSt,
          icmsStPercentageUfDestination: rule.ivaIcmsSt
            ? ufIcms?.icmsPercentage
            : undefined,
          icmsStValue:
            rule?.ivaIcmsSt && ufIcms
              ? icmsStBase_2 * (ufIcms.icmsPercentage / 100) - icmsValue
              : undefined,
          issCst:
            productVariation.product.type === ProductType.SERVICE
              ? rule.icmsCst
              : undefined,
          issBase:
            productVariation.product.type === ProductType.SERVICE
              ? icmsBase
              : undefined,
          issPercentage:
            productVariation.product.type === ProductType.SERVICE
              ? rule.icmsPercRedAliquota
              : undefined,
          issValue:
            productVariation.product.type === ProductType.SERVICE
              ? (icmsBase * (rule?.icmsPercRedAliquota ?? 0)) / 100
              : undefined,
          pisBase: totalValue,
          pisPercentage: rule.pisPerc,
          pisValue: (totalValue * rule.pisPerc) / 100,
          pisRetentionValue: 0,
          cofinsBase: totalValue,
          cofinsPercentage: rule.cofinsPerc,
          cofinsValue: (totalValue * rule.cofinsPerc) / 100,
          cofinsRetentionValue: 0,
          ipiCst: rule.ipiCst,
          ipiBase: totalValue,
          ipiPercentage: rule.ipiPerc,
          ipiValue: (totalValue * rule.ipiPerc) / 100,
          icmsDeferredValue: 0,
          icmsPartitionValue: 0,
          icmsFcpPercentage: rule.fcpPerc,
          icmsFcpValue: (icmsBase * rule.fcpPerc) / 100,
          icmsPartitionOriginUfPercentage: rule.icmsPerc,
          icmsPartitionDestinationUfPercentage: rule.icmsPercRedAliquota,
          icmsPartitionInterUfPercentage: rule.icmsPercRedAliquota,
        },
        {
          client: trx,
        },
      );

      const validItems = [billItem, ...items];

      let totalProductValue = 0;
      let totalServiceValue = 0;
      items.forEach(item => {
        if (item.productVariation.product.type === ProductType.PRODUCT) {
          totalProductValue += item.totalValue;
        }
        if (item.productVariation.product.type === ProductType.SERVICE) {
          totalServiceValue += item.totalValue;
        }
      });
      if (productVariation.product.type === ProductType.PRODUCT) {
        totalProductValue += billItem.totalValue;
      } else {
        totalServiceValue += billItem.totalValue;
      }

      // const totalProductValue = validItems.reduce(
      //   (acc, item) => acc + (item.totalValue ?? 0),
      //   0,
      // );

      const totalDiscountValue = validItems.reduce(
        (acc, item) => acc + (item.discountValue ?? 0),
        0,
      );

      await bill
        .merge({
          productValue: totalProductValue,
          serviceValue: totalServiceValue,
          discountValue: totalDiscountValue,
          totalValue: totalProductValue + totalServiceValue,
          icmsBase: validItems.reduce((acc, item) => acc + item.icmsBase, 0),
          icmsValue: validItems.reduce((acc, item) => acc + item.icmsValue, 0),
          icmsStBase: validItems.reduce(
            (acc, item) => acc + item.icmsStBase,
            0,
          ),
          icmsStValue: validItems.reduce(
            (acc, item) => acc + item.icmsStValue,
            0,
          ),
          issBase: validItems.reduce(
            (acc, item) => acc + (item.issBase ?? 0),
            0,
          ),
          issValue: validItems.reduce((acc, item) => acc + item.issValue, 0),
          pisBase: validItems.reduce((acc, item) => acc + item.pisBase, 0),
          pisValue: validItems.reduce((acc, item) => acc + item.pisValue, 0),
          pisRetentionValue: validItems.reduce(
            (acc, item) => acc + (item.pisRetentionValue ?? 0),
            0,
          ),
          cofinsBase: validItems.reduce(
            (acc, item) => acc + item.cofinsBase,
            0,
          ),
          cofinsValue: validItems.reduce(
            (acc, item) => acc + item.cofinsValue,
            0,
          ),
          cofinsRetentionValue: validItems.reduce(
            (acc, item) => acc + item.cofinsRetentionValue,
            0,
          ),
          ipiBase: validItems.reduce((acc, item) => acc + item.ipiBase, 0),
          ipiValue: validItems.reduce((acc, item) => acc + item.ipiValue, 0),
          icmsDeferredValue: validItems.reduce(
            (acc, item) => acc + item.icmsDeferredValue,
            0,
          ),
          icmsFcpValue: validItems.reduce(
            (acc, item) => acc + item.icmsFcpValue,
            0,
          ),
          icmsUfDestinationValue: validItems.reduce(
            (acc, item) => acc + (item?.icmsPartitionDestinationUfValue ?? 0),
            0,
          ),
          icmsUfOriginValue: validItems.reduce(
            (acc, item) => acc + (item?.icmsPartitionOriginUfValue ?? 0),
            0,
          ),
        })
        .useTransaction(trx)
        .save();

      return billItem;
    });
  }

  async updateBillItem(_: string, data: IUpdateBillItemData) {
    return Database.transaction(async trx => {
      const billItem = await BillItem.query()
        .where('id', data.billItemId)
        .preload('taxRule')
        .preload('bill', query => {
          query.preload('items', query => {
            query.whereNotIn('id', [data.billItemId]);

            query.preload('taxRule');
            query.preload('productVariation', query => {
              query.preload('product');
            });
          });
        })
        .preload('productVariation', query => {
          query.preload('product');
        })
        .firstOrFail();

      const ufIcms = await UfIcms.query()
        .useTransaction(trx)
        .where('origin_uf', billItem.taxRule.toUf)
        .where('destination_uf', billItem.taxRule.toUf)
        .first();

      const totalValue =
        billItem.unitaryValue * billItem.quantity - data.discountValue;
      const icmsBase =
        totalValue * ((100 - billItem.taxRule.icmsPercRedBaseCalculo) / 100);
      const icmsStBase_1 =
        icmsBase + (icmsBase * billItem.taxRule.ivaIcmsSt) / 100;
      const icmsStPercentageRedBase = billItem.taxRule.ivaIcmsSt
        ? billItem.taxRule.icmsPercRedBaseCalculoST
        : undefined;
      const icmsStBase_2 = billItem.taxRule.ivaIcmsSt
        ? icmsStBase_1 - (icmsStBase_1 * (icmsStPercentageRedBase ?? 0)) / 100
        : 0;
      const icmsValue = (icmsBase * (billItem.taxRule?.icmsPerc ?? 0)) / 100;

      const updated = await billItem
        .merge({
          discountValue: data.discountValue,
          totalValue,
          icmsOriginProduct: billItem.productVariation.product.icmsOrigin,
          icmsCst:
            billItem.taxRule?.ivaIcmsSt &&
            billItem.productVariation.product.type === ProductType.PRODUCT
              ? billItem.taxRule.icmsCst
              : undefined,
          icmsBase:
            billItem.productVariation.product.type === ProductType.PRODUCT
              ? icmsBase
              : undefined,
          icmsPercentage:
            billItem.productVariation.product.type === ProductType.PRODUCT
              ? billItem.taxRule.icmsPerc
              : undefined,
          icmsValue:
            billItem.productVariation.product.type === ProductType.PRODUCT
              ? icmsValue
              : undefined,
          icmsPercentageRedAliquot: billItem.taxRule.icmsPercRedAliquota,
          icmsPercentageRedBase: billItem.taxRule.icmsPercRedBaseCalculo,
          icmsStBase: billItem.taxRule?.ivaIcmsSt ? icmsStBase_2 : undefined,
          icmsStPercentageRedBase: billItem.taxRule.ivaIcmsSt
            ? billItem.taxRule.icmsPercRedBaseCalculoST
            : undefined,
          icmsStIva: billItem.taxRule.ivaIcmsSt,
          icmsStPercentageUfDestination: billItem.taxRule?.ivaIcmsSt
            ? ufIcms?.icmsPercentage
            : undefined,
          icmsStValue:
            ufIcms && billItem.taxRule?.ivaIcmsSt
              ? icmsStBase_2 * (ufIcms.icmsPercentage / 100) - icmsValue
              : undefined,
          issCst:
            billItem.productVariation.product.type === ProductType.SERVICE
              ? billItem.taxRule.icmsCst
              : undefined,
          issBase:
            billItem.productVariation.product.type === ProductType.SERVICE
              ? icmsBase
              : undefined,
          issPercentage:
            billItem.productVariation.product.type === ProductType.SERVICE
              ? billItem.taxRule.icmsPercRedAliquota
              : undefined,
          issValue:
            billItem.productVariation.product.type === ProductType.SERVICE
              ? (icmsBase * (billItem.taxRule?.icmsPercRedAliquota ?? 0)) / 100
              : undefined,
          pisBase: totalValue,
          pisPercentage: billItem.taxRule.pisPerc,
          pisValue: (totalValue * billItem.taxRule.pisPerc) / 100,
          pisRetentionValue: 0,
          cofinsBase: totalValue,
          cofinsPercentage: billItem.taxRule.cofinsPerc,
          cofinsValue: (totalValue * billItem.taxRule.cofinsPerc) / 100,
          cofinsRetentionValue: 0,
          ipiCst: billItem.taxRule.ipiCst,
          ipiBase: totalValue,
          ipiPercentage: billItem.taxRule.ipiPerc,
          ipiValue: (totalValue * billItem.taxRule.ipiPerc) / 100,
          icmsDeferredValue: 0,
          icmsPartitionValue: 0,
          icmsFcpPercentage: billItem.taxRule.fcpPerc,
          icmsFcpValue: (icmsBase * billItem.taxRule.fcpPerc) / 100,
          icmsPartitionOriginUfPercentage: billItem.taxRule.icmsPerc,
          icmsPartitionDestinationUfPercentage:
            billItem.taxRule.icmsPercRedAliquota,
          icmsPartitionInterUfPercentage: billItem.taxRule.icmsPercRedAliquota,
        })
        .useTransaction(trx)
        .save();

      const validItems = [updated, ...billItem.bill.items];
      let totalProductValue = 0;
      let totalServiceValue = 0;
      billItem.bill.items.forEach(item => {
        if (item.productVariation.product.type === ProductType.PRODUCT) {
          totalProductValue += item.totalValue;
        }
        if (item.productVariation.product.type === ProductType.SERVICE) {
          totalServiceValue += item.totalValue;
        }
      });
      if (billItem.productVariation.product.type === ProductType.PRODUCT) {
        totalProductValue += updated.totalValue;
      } else {
        totalServiceValue += updated.totalValue;
      }

      const totalDiscountValue = validItems.reduce(
        (acc, item) => acc + (item.discountValue ?? 0),
        0,
      );

      await billItem.bill
        .merge({
          productValue: totalProductValue,
          serviceValue: totalServiceValue,
          discountValue: totalDiscountValue,
          totalValue: totalProductValue + totalServiceValue,
          icmsBase: validItems.reduce((acc, item) => acc + item.icmsBase, 0),
          icmsValue: validItems.reduce((acc, item) => acc + item.icmsValue, 0),
          icmsStBase: validItems.reduce(
            (acc, item) => acc + item.icmsStBase,
            0,
          ),
          icmsStValue: validItems.reduce(
            (acc, item) => acc + item.icmsStValue,
            0,
          ),
          issBase: validItems.reduce(
            (acc, item) => acc + (item.issBase ?? 0),
            0,
          ),
          issValue: validItems.reduce((acc, item) => acc + item.issValue, 0),
          pisBase: validItems.reduce((acc, item) => acc + item.pisBase, 0),
          pisValue: validItems.reduce((acc, item) => acc + item.pisValue, 0),
          pisRetentionValue: validItems.reduce(
            (acc, item) => acc + (item.pisRetentionValue ?? 0),
            0,
          ),
          cofinsBase: validItems.reduce(
            (acc, item) => acc + item.cofinsBase,
            0,
          ),
          cofinsValue: validItems.reduce(
            (acc, item) => acc + item.cofinsValue,
            0,
          ),
          cofinsRetentionValue: validItems.reduce(
            (acc, item) => acc + item.cofinsRetentionValue,
            0,
          ),
          ipiBase: validItems.reduce((acc, item) => acc + item.ipiBase, 0),
          ipiValue: validItems.reduce((acc, item) => acc + item.ipiValue, 0),
          icmsDeferredValue: validItems.reduce(
            (acc, item) => acc + item.icmsDeferredValue,
            0,
          ),
          icmsFcpValue: validItems.reduce(
            (acc, item) => acc + item.icmsFcpValue,
            0,
          ),
          icmsUfDestinationValue: validItems.reduce(
            (acc, item) => acc + (item?.icmsPartitionDestinationUfValue ?? 0),
            0,
          ),
          icmsUfOriginValue: validItems.reduce(
            (acc, item) => acc + (item?.icmsPartitionOriginUfValue ?? 0),
            0,
          ),
        })
        .useTransaction(trx)
        .save();

      return updated;
    });
  }

  async createBillPayment(unitId: string, data: ICreateBillPaymentData) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const bill = await Bill.findOrFail(data.billId);
      const paymentMethod = await PaymentMethod.findOrFail(
        data.paymentMethodId,
        {
          client: trx,
        },
      );
      const flagInstallment = await PaymentMethodFlagInstallment.findOrFail(
        data.paymentMethodFlagInstallmentId,
        {
          client: trx,
        },
      );

      const existingPayments = await BillPayment.query().where(
        'bill_id',
        bill.id,
      );

      const uniqueBlocks = new Set(existingPayments.map(p => p.block));
      const singleValue = data.installmentsValue / flagInstallment.installment;

      const payments = await BillPayment.createMany(
        Array.from(
          { length: flagInstallment.installment },
          (_, v) => ({
            economic_group_id: group.id,
            business_unit_id: unitId,
            bill_id: bill.id,
            payment_method_id: data.paymentMethodId,
            tef_acquirer_id: data.acquirerId,
            tef_flag_id: data.flagId,

            block: uniqueBlocks.size + 1,
            expirationDate: data.expirationDate.plus({
              days:
                paymentMethod.daysFirstInstallment +
                paymentMethod.daysBetweenInstallments * v,
            }),
            feeType:
              paymentMethod.fee > 0
                ? BillPaymentFeeType.S
                : BillPaymentFeeType.N,
            feeValue: 0,
            feePercentage: 0,
            installments: v + 1,
            installmentValue: singleValue,
            totalValue: singleValue, // TODO: add fee
            nsuDocument: data.nsuDocument,
            paymentMethodDiscountPercentage: paymentMethod.fee,
            paymentMethodDiscountValue: (singleValue * paymentMethod.fee) / 100,
          }),
          {
            client: trx,
          },
        ),
      );

      await bill
        .merge({
          paidValue: bill.paidValue + data.installmentsValue,
        })
        .useTransaction(trx)
        .save();

      await Finance.createMany(
        Array.from({ length: flagInstallment.installment }, (_, v) => ({
          economic_group_id: group.id,
          business_unit_id: unitId,
          daily_movement_id: bill.daily_movement_id,
          daily_cashier_id: bill.daily_cashier_id,
          client_id: bill.client_id,
          type: FinanceType.C,
          payment_method_id: paymentMethod.id,
          installment: v + 1,
          block: uniqueBlocks.size + 1,
          originFlag: FinanceOriginFlag.S,
          document: `NFS-${bill.tag}`,
          historic: `NFS-${bill.tag}`,
          issueDate: DateTime.now(),
          expirationDate: payments.at(v)?.expirationDate,
          originalValue: singleValue,
          value: singleValue - (singleValue * paymentMethod.fee) / 100,
          totalValue: singleValue - (singleValue * paymentMethod.fee) / 100,
          feeDiscountValue:
            (payments.at(v)?.installmentValue ?? 0) -
            (singleValue - (singleValue * paymentMethod.fee) / 100),
          feeValue: 0,
          feeDiscountPercentage: paymentMethod.fee,
          feePercentage: 0,
          accept: FinanceAccept.S,
          reconciled: true,
          competenceDate: DateTime.now().toFormat('MM/yyyy'),
          nsuDocument: payments.at(v)?.nsuDocument,
          tef_flag_id: payments.at(v)?.tef_flag_id,
          acquirer_id: payments.at(v)?.tef_acquirer_id,
          status: FinanceStatus.A,
        })),
        {
          client: trx,
        },
      );
    });
  }

  async deleteBillPayment(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    await Database.transaction(async trx => {
      const payment = await BillPayment.query()
        .useTransaction(trx)
        .where('id', id)
        .preload('bill')
        .first();

      if (!payment || payment.bill.economic_group_id !== group.id) {
        throw this.sharedService.ResourceNotFound();
      }

      const finances = await Finance.query()
        .where('origin_flag', FinanceOriginFlag.S)
        .whereILike('document', `%${payment.bill.tag}%`)
        .where('block', payment.block);
      if (finances.some(p => p.status === FinanceStatus.B)) {
        throw new BadRequestException(
          'Já foi dado baixa em algum pagamento',
          400,
          'E_ERR',
        );
      }

      const updatedFinances = await Promise.all(
        finances
          .filter(p => p.status === FinanceStatus.A)
          .map(async p => {
            return p
              .merge({
                status: FinanceStatus.E,
                deletedAt: DateTime.now(),
              })
              .useTransaction(trx)
              .save();
          }),
      );
      await payment.useTransaction(trx).delete();
      await payment.bill
        .merge({
          paidValue:
            payment.bill.paidValue -
            updatedFinances.reduce((acc, curr) => acc + curr.value, 0),
        })
        .useTransaction(trx)
        .save();
    });
  }

  async searchProducts(unitId: string, data: ISearchProduct) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Product.query()
      .where('economic_group_id', group.id)
      .where('active', true);

    if (data.variation || data.barcode || data.quantity) {
      qb.whereHas('variations', query => {
        if (data.variation) {
          query.where('id', data.variation);
        }
        if (data.barcode) {
          query.where('barcode', 'ilike', `%${data.barcode}%`);
        }

        if (data.quantity) {
          query.whereHas('businessUnitProducts', query => {
            query.where('businness_unit_id', unitId);

            if (data.quantity) {
              query.where('stock', '>=', data.quantity);
            }
          });
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
      query.where('active', true);
      query.preload('variationOptions');
      query.preload('product');
      query.preload('businessUnitProducts', query => {
        query.where('businness_unit_id', unitId);
      });
    });
    qb.preload('unit');
    return qb;
  }

  async searchTax(unitId: string, data: ISearchTax) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = TaxationGroup.query()
      .where('economic_group_id', group.id)
      .where('active', true);

    if (data.origin) {
      qb.whereHas('rules', query => {
        query.where('from_uf', data.origin as string);
      });
    }

    if (data.destination) {
      qb.whereHas('rules', query => {
        query.where('to_uf', data.destination as string);
      });
    }

    if (data.type) {
      qb.whereHas('rules', query => {
        query.where('movement_type', data.type as string);
      });
    }

    if (data.category) {
      qb.whereHas('rules', query => {
        query.where('movement_category', data.category as string);
      });
    }

    if (data.groups) {
      qb.whereHas('rules', query => {
        query.whereIn('taxation_group_id', data.groups ?? []);
      });
    }

    qb.preload('rules', query => {
      query.where('active', true);

      if (data.origin) {
        query.where('from_uf', data.origin);
      }

      if (data.destination) {
        query.where('to_uf', data.destination);
      }

      if (data.type) {
        query.where('movement_type', data.type);
      }

      if (data.category) {
        query.where('movement_category', data.category);
      }

      if (data.groups) {
        query.whereIn('taxation_group_id', data.groups);
      }
    });

    const result = await qb;

    return result.map(tax => tax.rules).flat();
  }

  async closeBill(unitId: string, user: User, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const bill = await Bill.query()
      .where('economic_group_id', group.id)
      .where('id', id)
      .preload('payments')
      .first();

    if (!bill) {
      throw this.sharedService.ResourceNotFound();
    }

    if (bill.status !== BillStatus.A) {
      throw new BadRequestException(
        'Apenas notas de saídas abertas podem ser fechadas',
        400,
        'E_NOT_OPEN',
      );
    }

    const paymentsSum = bill.payments.reduce(
      (acc, curr) => acc + curr.totalValue,
      0,
    );
    if (paymentsSum < bill.totalValue) {
      throw new BadRequestException(
        'Valor de pagamentos é menor que o valor da nota',
        400,
        'E_NOT_OPEN',
      );
    }

    const dailyCashier = await DailyCashier.query()
      .where('business_unit_id', unitId)
      .where('user_who_opened_id', user.id)
      .where('status', DailyCashierStatus.A)
      .first();
    if (!dailyCashier) {
      throw new BadRequestException(
        'Usuário não tem caixa diário aberto',
        400,
        'E_NOT_OPEN',
      );
    }

    await Database.transaction(async trx => {
      await bill
        .merge({
          user_who_closed_id: user.id,
          closingDate: DateTime.now(),
          status: BillStatus.F,
        })
        .useTransaction(trx)
        .save();
    });
  }

  async reopenBill(unitId: string, _: User, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const bill = await Bill.query()
      .where('economic_group_id', group.id)
      .where('id', id)
      .first();

    if (!bill) {
      throw this.sharedService.ResourceNotFound();
    }

    if (bill.status !== BillStatus.F) {
      throw new BadRequestException(
        'Apenas notas de saídas fechadas podem ser abertas',
        400,
        'E_NOT_CLOSED',
      );
    }

    await bill
      .merge({
        user_who_closed_id: undefined,
        closingDate: undefined,
        status: BillStatus.A,
      })
      .save();
  }

  async disableBillItem(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const item = await BillItem.query().where('id', id).preload('bill').first();

    if (!item || item.bill.economic_group_id !== group.id) {
      throw this.sharedService.ResourceNotFound();
    }

    await Database.transaction(async trx => {
      await item
        .merge({
          status: BillItemStatus.I,
          disabledAt: DateTime.now(),
        })
        .useTransaction(trx)
        .save();

      const validItems = await BillItem.query()
        .whereNot('id', id)
        .where('status', BillItemStatus.A)
        .preload('productVariation', query => {
          query.preload('product');
        });

      let totalProductValue = 0;
      let totalServiceValue = 0;
      validItems.forEach(item => {
        if (item.productVariation.product.type === ProductType.PRODUCT) {
          totalProductValue += item.totalValue;
        }
        if (item.productVariation.product.type === ProductType.SERVICE) {
          totalServiceValue += item.totalValue;
        }
      });

      // const totalProductValue = validItems.reduce(
      //   (acc, item) => acc + item.totalValue,
      //   0,
      // );

      const totalDiscountValue = validItems.reduce(
        (acc, item) => acc + item.discountValue,
        0,
      );

      await item.bill
        .merge({
          productValue: totalProductValue,
          serviceValue: totalServiceValue,
          discountValue: totalDiscountValue,
          totalValue:
            totalProductValue + totalServiceValue - totalDiscountValue,
          icmsBase: validItems.reduce((acc, item) => acc + item.icmsBase, 0),
          icmsValue: validItems.reduce((acc, item) => acc + item.icmsValue, 0),
          icmsStBase: validItems.reduce(
            (acc, item) => acc + item.icmsStBase,
            0,
          ),
          icmsStValue: validItems.reduce(
            (acc, item) => acc + item.icmsStValue,
            0,
          ),
          issBase: validItems.reduce((acc, item) => acc + item.issBase, 0),
          issValue: validItems.reduce((acc, item) => acc + item.issValue, 0),
          pisBase: validItems.reduce((acc, item) => acc + item.pisBase, 0),
          pisValue: validItems.reduce((acc, item) => acc + item.pisValue, 0),
          pisRetentionValue: validItems.reduce(
            (acc, item) => acc + item.pisRetentionValue,
            0,
          ),
          cofinsBase: validItems.reduce(
            (acc, item) => acc + item.cofinsBase,
            0,
          ),
          cofinsValue: validItems.reduce(
            (acc, item) => acc + item.cofinsValue,
            0,
          ),
          cofinsRetentionValue: validItems.reduce(
            (acc, item) => acc + item.cofinsRetentionValue,
            0,
          ),
          ipiBase: validItems.reduce((acc, item) => acc + item.ipiBase, 0),
          ipiValue: validItems.reduce((acc, item) => acc + item.ipiValue, 0),
          icmsDeferredValue: validItems.reduce(
            (acc, item) => acc + item.icmsDeferredValue,
            0,
          ),
          icmsFcpValue: validItems.reduce(
            (acc, item) => acc + item.icmsFcpValue,
            0,
          ),
          icmsUfDestinationValue: validItems.reduce(
            (acc, item) => acc + (item?.icmsPartitionDestinationUfValue ?? 0),
            0,
          ),
          icmsUfOriginValue: validItems.reduce(
            (acc, item) => acc + (item?.icmsPartitionOriginUfValue ?? 0),
            0,
          ),
        })
        .useTransaction(trx)
        .save();
    });
  }

  async recalculateItemsTaxes(unitId: string, id: string) {
    await Database.transaction(async trx => {
      const unit = await BusinessUnit.findOrFail(id, {
        client: trx,
      });

      const bill = await Bill.query()
        .useTransaction(trx)
        .where('business_unit_id', unitId)
        .where('id', id)
        .preload('items', query => {
          query.preload('productVariation', query => {
            query.preload('product');
          });
        })
        .preload('client', query => {
          query.preload('tutor');
        })
        .first();

      if (!bill) {
        throw this.sharedService.ResourceNotFound();
      }

      const itemsWithoutTaxes = bill.items.filter(i => !i.tax_rule_id);
      if (itemsWithoutTaxes.length > 0) {
        const productVariations = await ProductVariation.query()
          .useTransaction(trx)
          .whereIn(
            'id',
            itemsWithoutTaxes.map(i => i.product_variation_id),
          )
          .preload('product')
          .preload('businessUnitProducts', query => {
            query.where('businness_unit_id', unitId);
          });

        const taxRules = await TaxationGroupRule.query()
          .useTransaction(trx)
          .whereHas('taxationGroup', query => {
            query.whereIn(
              'id',
              productVariations.map(item => item.product.taxation_group_id),
            );
          })
          .where('movementType', MovementType.S)
          .where('movementCategory', MovementCategory.NS)
          .where('fromUf', unit.state ?? '')
          .where('toUf', bill.client.tutor.state ?? '')
          .preload('taxationGroup')
          .preload('taxOperation');

        const ufIcms = await UfIcms.query()
          .whereIn(
            'origin_uf',
            taxRules.map(rule => rule.toUf),
          )
          .whereIn(
            'destination_uf',
            taxRules.map(rule => rule.toUf),
          );

        itemsWithoutTaxes.forEach(async item => {
          const rule = taxRules.find(
            rule =>
              rule.taxationGroup.id ===
              item.productVariation.product.taxation_group_id,
          );

          if (rule) {
            const ufIcmsRule = ufIcms.find(
              ufIcms =>
                ufIcms.originUf === rule.fromUf &&
                ufIcms.destinationUf === rule.toUf,
            );

            const totalValue =
              item.unitaryValue * item.quantity - item.discountValue;
            const icmsBase =
              totalValue * ((100 - (rule.icmsPercRedBaseCalculo ?? 0)) / 100);
            const icmsStBase_1 = icmsBase + (icmsBase * rule.ivaIcmsSt) / 100;
            const icmsStPercentageRedBase = rule.ivaIcmsSt
              ? rule.icmsPercRedBaseCalculoST
              : undefined;
            const icmsStBase_2 = rule.ivaIcmsSt
              ? icmsStBase_1 -
                (icmsStBase_1 * (icmsStPercentageRedBase ?? 0)) / 100
              : 0;
            const icmsValue = (icmsBase * (rule?.icmsPerc ?? 0)) / 100;

            await item
              .merge({
                tax_rule_id: rule.id,
                fiscalOperationCode: rule.taxOperation.code,
                icmsCst: rule.ivaIcmsSt ? rule.icmsCst : undefined,
                icmsBase,
                icmsPercentage: rule.icmsPerc,
                icmsValue,
                icmsPercentageRedAliquot: rule.icmsPercRedAliquota,
                icmsPercentageRedBase: rule.icmsPercRedBaseCalculo,
                icmsStPercentageUfDestination: rule?.ivaIcmsSt
                  ? ufIcmsRule?.icmsPercentage
                  : undefined,
                icmsStBase: rule.ivaIcmsSt ? icmsStBase_2 : undefined,
                icmsStPercentageRedBase,
                icmsStIva: rule.ivaIcmsSt,
                icmsStValue: rule.ivaIcmsSt
                  ? icmsStBase_2 * ((ufIcmsRule?.icmsPercentage ?? 100) / 100) -
                    icmsValue
                  : undefined,
                issBase: rule.icmsPerc,
                issPercentage: rule.icmsPercRedAliquota,
                pisPercentage: rule.pisPerc,
                cofinsPercentage: rule.cofinsPerc,
                ipiPercentage: rule.ipiPerc,
                icmsFcpPercentage: rule.fcpPerc,
                icmsPartitionOriginUfPercentage: rule.icmsPerc,
                icmsPartitionDestinationUfPercentage: rule.icmsPercRedAliquota,
                icmsPartitionInterUfPercentage: rule.icmsPercRedAliquota,
              })
              .useTransaction(trx)
              .save();
          }
        });
      }
    });
  }
}
