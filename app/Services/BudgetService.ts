import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import Bill from 'App/Models/Bill';
import Budget, { BudgetStatus } from 'App/Models/Budget';
import BudgetItem from 'App/Models/BudgetItem';
import Product from 'App/Models/Product';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import {
  ICancelBudgetData,
  IConfirmBudgetData,
  ICreateBudgetData,
  ICreateBudgetItemData,
  IUpdateBudgetItemData,
} from 'Contracts/interfaces/IBudgetData';

interface ISearchPartial {
  fromCreation?: string;
  toCreation?: string;
  fromExpiration?: string;
  toExpiration?: string;
  seller?: string;
  status?: string;
}

interface ISearchComplete {
  budget?: string;
}

interface ISearchProduct {
  variation?: string;
  description?: string;
  unit?: string;
  quantity?: string;
  minPrice?: string;
  maxPrice?: string;
  maxDiscountPercentage?: string;
  reference?: string;
  barcode?: string;
}

@inject()
export default class BudgetService {
  constructor(private sharedService: SharedService) {}

  public async partialIndex(unitId: string, data: ISearchPartial) {
    const qb = Budget.query().where('business_unit_id', unitId);

    if (data.fromCreation) {
      qb.where('budget_date', '>=', data.fromCreation);
    }

    if (data.toCreation) {
      qb.where('budget_date', '<=', data.toCreation);
    }

    if (data.fromExpiration) {
      qb.where('expiration_date', '>=', data.fromExpiration);
    }

    if (data.toExpiration) {
      qb.where('expiration_date', '<=', data.toExpiration);
    }

    if (data.seller) {
      qb.where('seller_id', data.seller);
    }

    if (data.status) {
      qb.where('status', data.status);
    }

    qb.preload('client', query => {
      query.preload('tutor');
    });
    qb.preload('user');
    qb.preload('seller');
    qb.preload('dailyMovement');
    qb.preload('dailyCashier');
    qb.preload('conclusionUser');
    qb.preload('cancelationReason');

    return qb;
  }

  public async completeIndex(unitId: string, data: ISearchComplete) {
    const qb = Budget.query().where('business_unit_id', unitId);

    if (data.budget) {
      qb.where('id', data.budget);
    }

    qb.preload('client', query => {
      query.preload('tutor');
    });
    qb.preload('user');
    qb.preload('seller');
    qb.preload('dailyMovement');
    qb.preload('dailyCashier');
    qb.preload('conclusionUser');
    qb.preload('cancelationReason');
    qb.preload('items', query => {
      query.preload('productVariation', query => {
        query.preload('product');
      });
    });

    return qb;
  }

  public async show(unitId: string, id: string) {
    const qb = Budget.query().where('business_unit_id', unitId).where('id', id);

    qb.preload('client', query => {
      query.preload('tutor');
    });
    qb.preload('user');
    qb.preload('seller');
    qb.preload('dailyMovement');
    qb.preload('dailyCashier');
    qb.preload('conclusionUser');
    qb.preload('cancelationReason');
    qb.preload('items', query => {
      query.preload('productVariation', query => {
        query.preload('product');
      });
    });

    const result = await qb.first();

    if (!result) {
      throw this.sharedService.ResourceNotFound('Orçamento não encontrado');
    }

    return result;
  }

  public async searchProducts(unitId: string, data: ISearchProduct) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Product.query().where('economic_group_id', group.id);

    if (
      data.variation ||
      data.barcode ||
      data.quantity ||
      data.minPrice ||
      data.maxPrice ||
      data.maxDiscountPercentage
    ) {
      qb.whereHas('variations', query => {
        if (data.variation) {
          query.where('id', data.variation);
        }

        if (data.barcode) {
          query.whereILike('barcode', data.barcode);
        }

        if (
          data.minPrice ||
          data.maxPrice ||
          data.quantity ||
          data.maxDiscountPercentage
        ) {
          query.whereHas('businessUnitProducts', query => {
            query.where('businness_unit_id', unitId);

            if (data.quantity) {
              query.where('stock', '>=', data.quantity);
            }

            if (data.minPrice) {
              query.where('price', '>=', parseFloat(data.minPrice));
            }

            if (data.maxPrice) {
              query.where('price', '<=', parseFloat(data.maxPrice));
            }

            if (data.maxDiscountPercentage) {
              query.where(
                'maximumDiscountPercentage',
                '<=',
                data.maxDiscountPercentage,
              );
            }
          });
        }
      });
    }

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.unit) {
      qb.where('unit_id', data.unit);
    }

    if (data.reference) {
      qb.where('referenceCode', 'ilike', `%${data.reference}%`);
    }

    qb.preload('variations', query => {
      query.preload('businessUnitProducts', query => {
        query.where('businness_unit_id', unitId);

        if (data.quantity) {
          query.where('stock', '>=', parseFloat(data.quantity));
        }

        if (data.minPrice) {
          query.where('price', '>=', parseFloat(data.minPrice));
        }

        if (data.maxPrice) {
          query.where('price', '<=', parseFloat(data.maxPrice));
        }

        if (data.maxDiscountPercentage) {
          query.where(
            'maximumDiscountPercentage',
            '<=',
            data.maxDiscountPercentage,
          );
        }
      });
    });
    qb.preload('unit');

    return qb;
  }

  public async createBudget(
    unitId: string,
    user: User,
    data: ICreateBudgetData,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Budget.create({
      economic_group_id: group.id,
      business_unit_id: unitId,
      client_id: data.clientId,
      user_id: user.id,
      seller_id: user.id,
      daily_movement_id: data.dailyMovementId,
      daily_cashier_id: data.dailyCashierId,
      budgetDate: data.budgetDate,
      expirationDate: data.expirationDate,
      productValue: data.productValue,
      serviceValue: data.serviceValue,
      discountValue: data.discountValue,
      totalValue: data.productValue + data.serviceValue - data.discountValue,
      observation: data.observation,
      status: BudgetStatus.A,
    });
  }

  public async createBudgetItem(unitId: string, data: ICreateBudgetItemData) {
    const budget = await Budget.findOrFail(data.budgetId);
    const group = await this.sharedService.getUserGroup(unitId);

    return BudgetItem.create({
      economic_group_id: group.id,
      business_unit_id: unitId,
      budget_id: budget.id,
      product_variation_id: data.productVariationId,

      unitaryValue: data.unitaryValue,
      discountValue: data.discountValue,
      quantity: data.quantity,
      totalValue: data.quantity * data.unitaryValue - data.discountValue,
      status: BudgetStatus.A,
    });
  }

  public async updateBudgetItem(
    unitId: string,
    id: string,
    data: IUpdateBudgetItemData,
  ) {
    const budgetItem = await BudgetItem.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!budgetItem) {
      throw this.sharedService.ResourceNotFound();
    }

    return budgetItem
      .merge({
        unitaryValue: data.unitaryValue,
        discountValue: data.discountValue,
        quantity: data.quantity,
        totalValue: data.quantity * data.unitaryValue - data.discountValue,
        status: data.status,
      })
      .save();
  }

  public async confirmBudget(
    unitId: string,
    id: string,
    user: User,
    data: IConfirmBudgetData,
  ) {
    const model = await Budget.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!model) {
      throw this.sharedService.ResourceNotFound();
    }

    const bill = await Bill.findOrFail(data.billId);
    const items = await model.related('items').query();

    return Database.transaction(async trx => {
      data.notConfirmedItems.forEach(async item => {
        const budgetItem = items.find(i => i.id === item);

        if (budgetItem) {
          await budgetItem
            .merge({
              status: BudgetStatus.C,
            })
            .useTransaction(trx)
            .save();
        }
      });

      await bill
        .merge({
          budget_id: model.id,
        })
        .useTransaction(trx)
        .save();

      return model
        .merge({
          conclusion_user_id: user.id,
          finishedAt: data.finishedAt,
          status: data.type === 'PARCIAL' ? BudgetStatus.P : BudgetStatus.C,
          cancelation_reason_id:
            data.type === 'PARCIAL' ? data.reasonId : undefined,
          canceledObservation:
            data.type === 'PARCIAL' ? data.canceledObservation : undefined,
        })
        .useTransaction(trx)
        .save();
    });
  }

  public async cancelBudget(
    unitId: string,
    id: string,
    user: User,
    data: ICancelBudgetData,
  ) {
    const model = await Budget.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!model) {
      throw this.sharedService.ResourceNotFound();
    }

    return model
      .merge({
        conclusion_user_id: user.id,
        finishedAt: data.finishedAt,
        cancelation_reason_id: data.reasonId,
        canceledObservation: data.canceledObservation,
        status: BudgetStatus.N,
      })
      .save();
  }
}
