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
import PaymentMethod from 'App/Models/PaymentMethod';
import Product from 'App/Models/Product';
import ProductVariation from 'App/Models/ProductVariation';
import TaxationGroup from 'App/Models/TaxationGroup';
import TaxationGroupRule, { MovementType } from 'App/Models/TaxationGroupRule';
import UfIcms from 'App/Models/UfIcms';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import { GenerateTag } from 'App/Utils/GenerateTag';
import {
  ICreateBillData,
  ICreateBillItemData,
  ICreateBillPaymentData,
} from 'Contracts/interfaces/IBIllData';
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

    const bills = await Bill.query().select('id');

    const productVariations = await ProductVariation.query()
      .whereIn(
        'id',
        data.items.map(item => item.productVariationId),
      )
      .preload('product')
      .preload('businessUnitProducts', query => {
        query.where('businness_unit_id', unitId);
      });

    const taxRules = await TaxationGroupRule.query()
      .whereHas('taxationGroup', query => {
        query.whereIn(
          'id',
          productVariations.map(item => item.product.taxation_group_id),
        );
      })
      .preload('taxationGroup')
      .preload('taxOperation');

    const ufIcms = await UfIcms.query()
      .whereIn(
        'origin_uf',
        taxRules.map(rule => rule.fromUf),
      )
      .whereIn(
        'destination_uf',
        taxRules.map(rule => rule.toUf),
      );

    // if (ufIcms.length !== taxRules.length) {
    //   throw new InternalErrorException(
    //     'Não foi possível encontrar a alíquota de ICMS para a UF de origem e destino',
    //     500,
    //     'E_INTERNAL_ERROR',
    //   );
    // }

    return Database.transaction(async trx => {
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
            ufIcms.originUf === rule?.fromUf &&
            ufIcms.destinationUf === rule?.toUf,
        );

        const totalValue =
          item.unitaryValue * item.quantity - item.discountValue;
        const icmsBase =
          totalValue * ((100 - (rule?.icmsPercRedBaseCalculo ?? 0)) / 100);
        const icmsStBase =
          icmsBase *
          ((100 + (rule?.ivaIcmsSt ?? 0)) / 100) *
          ((100 - (rule?.icmsPercRedBaseCalculo ?? 0)) / 100);
        const icmsValue =
          icmsBase *
          (((rule?.icmsPercRedBaseCalculo ?? 1) *
            ((100 - (rule?.icmsPercRedAliquota ?? 0)) / 100)) /
            100);

        return BillItem.create(
          {
            economic_group_id: group.id,
            business_unit_id: unitId,
            bill_id: bill.id,
            product_variation_id: item.productVariationId,
            tax_rule_id: rule?.id,

            quantity: item.quantity,
            costValue: price?.costPrice,
            saleValue: price?.costPrice,
            unitaryValue: item.unitaryValue,
            discountValue: item.discountValue,
            totalValue,
            status: BillItemStatus.A,
            createdAt: bill.createdAt,

            fiscalOperationCode: rule?.taxOperation.code,
            icmsOriginProduct: variation.product.icmsOrigin,
            icmsCst: rule?.icmsCst,
            icmsBase,
            icmsPercentage: rule?.icmsPerc,
            icmsValue,
            icmsPercentageRedAliquot: rule?.icmsPercRedAliquota,
            icmsPercentageRedBase: rule?.icmsPercRedBaseCalculo,
            icmsStBase,
            icmsStPercentageRedBase: rule?.icmsPercRedAliquota,
            icmsStIva: rule?.icmsPercRedAliquota,
            icmsStPercentageUfDestination: 0,
            icmsStValue:
              icmsStBase * ((ufIcmsRule?.icmsPercentage ?? 100) / 100) -
              icmsValue,
            issCst: '',
            issBase: rule?.icmsPerc,
            issPercentage: rule?.icmsPercRedAliquota,
            issValue: 0,
            pisBase: 0,
            pisPercentage: rule?.pisPerc,
            pisValue: 0,
            pisRetentionValue: 0,
            cofinsBase: 0,
            cofinsPercentage: rule?.cofinsPerc,
            cofinsValue: 0,
            cofinsRetentionValue: 0,
            ipiBase: 0,
            ipiPercentage: rule?.ipiPerc,
            ipiValue: 0,
            icmsDeferredValue: 0,
            icmsPartitionValue: 0,
            icmsFcpPercentage: rule?.fcpPerc,
            icmsFcpValue: 0,
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

      const totalProductValue = validItems.reduce(
        (acc, item) => acc + item.totalValue,
        0,
      );

      const totalDiscountValue = validItems.reduce(
        (acc, item) => acc + item.discountValue,
        0,
      );

      await bill
        .merge({
          productValue: totalProductValue,
          serviceValue: 0,
          discountValue: totalDiscountValue,
          totalValue: totalProductValue - totalDiscountValue,
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

      return bill;
    });
  }

  async createBillItem(unitId: string, data: ICreateBillItemData) {
    const group = await this.sharedService.getUserGroup(unitId);
    const unit = await BusinessUnit.findOrFail(unitId);

    const bill = await Bill.findOrFail(data.billId);
    const items = await bill.related('items').query();

    const rule = await TaxationGroupRule.query()
      .where('movement_type', MovementType.S)
      .where('from_uf', unit.state ?? '')
      .where('to_uf', unit.state ?? '')
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
      .where('origin_uf', rule.fromUf)
      .where('destination_uf', rule.fromUf)
      .first();
    // if (!ufIcms) {
    //   throw new InternalErrorException(
    //     'Não foi possível encontrar a alíquota de ICMS para a UF de origem e destino',
    //     500,
    //     'E_INTERNAL_ERROR',
    //   );
    // }

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
          costValue: price.costPrice,
          saleValue: price.price,
          unitaryValue: data.unitaryValue,
          discountValue: data.discountValue,
          totalValue,
          status: BillItemStatus.A,
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
          icmsStValue: ufIcms
            ? icmsStBase * (ufIcms.icmsPercentage / 100) - icmsValue
            : undefined,
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
    const unit = await this.sharedService.getBUnit(unitId);

    const bill = await Bill.findOrFail(data.billId);
    const paymentMethod = await PaymentMethod.findOrFail(data.paymentMethodId);

    const existingPayments = await BillPayment.query().where(
      'bill_id',
      bill.id,
    );

    const uniqueBlocks = new Set(existingPayments.map(p => p.block));
    const singleValue = data.installmentsValue / data.installments;

    return Database.transaction(async trx => {
      const payments = await BillPayment.createMany(
        Array.from(
          { length: data.installments },
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
        Array.from({ length: data.installments }, (_, v) => ({
          economic_group_id: group.id,
          business_unit_id: unitId,
          daily_movement_id: bill.daily_movement_id,
          daily_cashier_id: bill.daily_cashier_id,
          client_id: bill.client_id,
          checking_account_id: unit.unitConfig?.sale_exit_account_plan_id,
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

      // await Finance.createMany(
      //   bill.payments.map(payment => ({
      //     economic_group_id: group.id,
      //     business_unit_id: unitId,
      //     daily_movement_id: dailyCashier.daily_movement_id,
      //     daily_cashier_id: dailyCashier.id,
      //     client_id: bill.client_id,
      //     type: FinanceType.C,
      //     payment_method_id: payment.payment_method_id,
      //     installment: payment.block,
      //     originFlag: FinanceOriginFlag.S,
      //     document: `NFS-${bill.tag}`,
      //     historic: `NFS-${bill.tag}`,
      //     issueDate: DateTime.now(),
      //     expirationDate: payment.expirationDate,
      //     originalValue: bill.totalValue, // TODO check 2.20.2.16.
      //     value: payment.installmentValue, // 2.17
      //     totalValue: payment.totalValue, // 2.18
      //     feeValue: payment.feeValue, // 2.19
      //     feePercentage: payment.feePercentage, // 2.20
      //     accept: FinanceAccept.S,
      //     reconciled: true,
      //     competenceDate: DateTime.now().toFormat('MM/yyyy'),
      //     nsuDocument: payment.nsuDocument,
      //     tef_flag_id: payment.tef_flag_id,
      //     acquirer_id: payment.tef_acquirer_id,
      //     status: FinanceStatus.A,
      //   })),
      //   {
      //     client: trx,
      //   },
      // );
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
        .where('status', BillItemStatus.A);

      const totalProductValue = validItems.reduce(
        (acc, item) => acc + item.totalValue,
        0,
      );

      const totalDiscountValue = validItems.reduce(
        (acc, item) => acc + item.discountValue,
        0,
      );

      await item.bill
        .merge({
          productValue: totalProductValue,
          serviceValue: 0,
          discountValue: totalDiscountValue,
          totalValue: totalProductValue - totalDiscountValue,
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
      const bill = await Bill.query()
        .useTransaction(trx)
        .where('business_unit_id', unitId)
        .where('id', id)
        .preload('items', query => {
          query.preload('productVariation', query => {
            query.preload('product');
          });
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
          .preload('taxationGroup')
          .preload('taxOperation');

        const ufIcms = await UfIcms.query()
          .whereIn(
            'origin_uf',
            taxRules.map(rule => rule.fromUf),
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

          if (!rule) {
            return;
          }

          const ufIcmsRule = ufIcms.find(
            ufIcms =>
              ufIcms.originUf === rule.fromUf &&
              ufIcms.destinationUf === rule.toUf,
          );

          const totalValue =
            item.unitaryValue * item.quantity - item.discountValue;
          const icmsBase =
            totalValue * ((100 - (rule.icmsPercRedBaseCalculo ?? 0)) / 100);
          const icmsStBase =
            icmsBase *
            ((100 + (rule.ivaIcmsSt ?? 0)) / 100) *
            ((100 - (rule.icmsPercRedBaseCalculo ?? 0)) / 100);
          const icmsValue =
            icmsBase *
            (((rule.icmsPercRedBaseCalculo ?? 1) *
              ((100 - (rule.icmsPercRedAliquota ?? 0)) / 100)) /
              100);

          await item
            .merge({
              tax_rule_id: rule.id,
              fiscalOperationCode: rule.taxOperation.code,
              icmsCst: rule.icmsCst,
              icmsBase,
              icmsPercentage: rule.icmsPerc,
              icmsValue,
              icmsPercentageRedAliquot: rule.icmsPercRedAliquota,
              icmsPercentageRedBase: rule.icmsPercRedBaseCalculo,
              icmsStBase,
              icmsStPercentageRedBase: rule.icmsPercRedAliquota,
              icmsStIva: rule.icmsPercRedAliquota,
              icmsStValue:
                icmsStBase * ((ufIcmsRule?.icmsPercentage ?? 100) / 100) -
                icmsValue,
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
        });
      }
    });
  }
}
