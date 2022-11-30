import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import Bill, { BillStatus } from 'App/Models/Bill';
import BillItem from 'App/Models/BillItem';
import BillPayment, { BillPaymentFeeType } from 'App/Models/BillPayment';
import Product from 'App/Models/Product';
import ProductVariation from 'App/Models/ProductVariation';
import TaxationGroup from 'App/Models/TaxationGroup';
import TaxationGroupRule from 'App/Models/TaxationGroupRule';
import UfIcms from 'App/Models/UfIcms';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import {
  ICreateBillData,
  ICreateBillItemData,
  ICreateBillPaymentData,
} from 'Contracts/interfaces/IBIllData';

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
}

@inject()
export default class BillService {
  constructor(private sharedService: SharedService) {}

  async createBill(unitId: string, user: User, data: ICreateBillData) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Bill.create({
      economic_group_id: group.id,
      business_unit_id: unitId,
      user_id: user.id,
      seller_id: user.id,
      daily_movement_id: data.dailyMovementId,
      daily_cashier_id: data.dailyCashierId,
      budget_id: data.budgetId,

      client_id: data.clientId,
      billDate: data.billDate,
      productValue: data.productValue,
      serviceValue: data.serviceValue,
      discountValue: data.discountValue,
      totalValue: data.productValue + data.serviceValue - data.discountValue,
      deliveryValue: 0,
      additionalInformation: data.additionalInformation,
      status: BillStatus.A,

      otherValue: data.otherValue,
    });
  }

  async createBillItem(unitId: string, data: ICreateBillItemData) {
    const group = await this.sharedService.getUserGroup(unitId);

    const bill = await Bill.findOrFail(data.billId);
    const items = await bill.related('items').query();
    const rule = await TaxationGroupRule.findOrFail(data.taxationGroupRuleId);
    await rule.load('taxOperation');

    const ufIcms = await UfIcms.query()
      .where('origin_uf', rule.fromUf)
      .where('destination_uf', rule.fromUf)
      .first();
    if (!ufIcms) {
      throw new InternalErrorException(
        'Não foi possível encontrar a alíquota de ICMS para a UF de origem e destino',
        500,
        'E_INTERNAL_ERROR',
      );
    }

    const productVariation = await ProductVariation.query()
      .where('id', data.productVariationId)
      .preload('product')
      .firstOrFail();

    return Database.transaction(async trx => {
      const totalValue = data.unitaryValue * data.quantity - data.discountValue;
      const icmsBase = totalValue * ((100 - rule.icmsPercRedBaseCalculo) / 100);
      const icmsStBase =
        icmsBase *
        ((100 + rule.ivaIcmsSt) / 100) *
        ((100 - rule.icmsPercRedBaseCalculo) / 100);
      const icmsValue =
        icmsBase *
        ((rule.icmsPercRedBaseCalculo *
          ((100 - rule.icmsPercRedAliquota) / 100)) /
          100);

      const billItem = await BillItem.create(
        {
          economic_group_id: group.id,
          business_unit_id: unitId,
          bill_id: bill.id,
          product_variation_id: data.productVariationId,
          tax_rule_id: rule.id,

          quantity: data.quantity,
          costValue: data.costValue,
          saleValue: data.saleValue,
          unitaryValue: data.unitaryValue,
          discountValue: data.discountValue,
          totalValue,
          status: BillStatus.A,
          createdAt: bill.createdAt,

          fiscalOperationCode: rule.taxOperation.code,
          icmsOriginProduct: productVariation.product.icmsOrigin,
          icmsCst: rule.icmsCst,
          icmsBase,
          icmsPercentage: rule.icmsPerc,
          icmsValue,
          icmsPercentageRedAliquot: rule.icmsPercRedAliquota,
          icmsPercentageRedBase: rule.icmsPercRedBaseCalculo,
          icmsStBase,
          icmsStPercentageRedBase: rule.icmsPercRedAliquota,
          icmsStIva: rule.icmsPercRedAliquota,
          icmsStPercentageUfDestination: 0,
          icmsStValue: icmsStBase * (ufIcms.icmsPercentage / 100) - icmsValue,
          issCst: '',
          issBase: rule.icmsPerc,
          issPercentage: rule.icmsPercRedAliquota,
          issValue: 0,
          pisBase: 0,
          pisPercentage: rule.pisPerc,
          pisValue: 0,
          pisRetentionValue: 0,
          cofinsBase: 0,
          cofinsPercentage: rule.cofinsPerc,
          cofinsValue: 0,
          cofinsRetentionValue: 0,
          ipiBase: 0,
          ipiPercentage: rule.ipiPerc,
          ipiValue: 0,
          icmsDeferredValue: 0,
          icmsPartitionValue: 0,
          icmsFcpPercentage: rule.fcpPerc,
          icmsFcpValue: 0,
          icmsPartitionOriginUfPercentage: rule.icmsPerc,
          icmsPartitionDestinationUfPercentage: rule.icmsPercRedAliquota,
          icmsPartitionInterUfPercentage: rule.icmsPercRedAliquota,
        },
        {
          client: trx,
        },
      );

      const validItems = [billItem, ...items];

      await bill
        .merge({
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

      return billItem;
    });
  }

  async createBillPayment(unitId: string, data: ICreateBillPaymentData) {
    const group = await this.sharedService.getUserGroup(unitId);

    const bill = await Bill.findOrFail(data.billId);

    const existingPayments = await BillPayment.query().where(
      'bill_id',
      bill.id,
    );

    const uniqueBlocks = new Set(existingPayments.map(p => p.block));

    return BillPayment.create({
      economic_group_id: group.id,
      business_unit_id: unitId,
      bill_id: bill.id,
      payment_method_id: data.paymentMethodId,

      block: uniqueBlocks.size + 1,
      expirationDate: data.expirationDate,
      feeType: BillPaymentFeeType.N,
      feeValue: 0,
      feePercentage: 0,
      installmentValue: data.installmentValue,
      totalValue: data.installmentValue, // TODO: add fee
    });
  }

  public async searchProducts(unitId: string, data: ISearchProduct) {
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
    });
    qb.preload('unit');

    return qb;
  }

  public async searchTax(unitId: string, data: ISearchTax) {
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
    });

    const result = await qb;

    return result.map(tax => tax.rules).flat();
  }
}
