import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import ProductivityItem from 'App/Models/ProductivityItem';
import ProductivityItemProduct from 'App/Models/ProductivityItemProduct';
import SharedService, { AuthContext } from 'App/Services/SharedService';

@inject()
export default class ProductivityItemService {
  constructor(private shared: SharedService) {}

  public async searchItems(
    authCtx: AuthContext,
    data: {
      active?: string;
    },
  ) {
    const qb = ProductivityItem.query().where(
      'economic_group_id',
      authCtx.group.id,
    );

    if (data.active) {
      qb.where('active', data.active === '1');
    }

    return qb;
  }

  public async searchItemProducts(
    authCtx: AuthContext,
    data: {
      variation?: string;
      active?: string;
    },
  ) {
    const qb = ProductivityItemProduct.query()
      .preload('productVariation', query => {
        query.preload('product');
      })
      .where('economic_group_id', authCtx.group.id)
      .where('active', data.active ? data.active === '1' : true);

    if (data.variation) {
      qb.where('product_variation_id', data.variation);
    }

    const result = await qb;

    return result.map(elem => ({
      id: elem.id,
      quantity: elem.quantity,
      description: elem.productVariation.product.description,
    }));
  }

  public async storeItem(
    authCtx: AuthContext,
    data: {
      description: string;
    },
  ) {
    await ProductivityItem.create({
      economic_group_id: authCtx.group.id,
      description: data.description,
    });
  }

  public async updateItem(
    authCtx: AuthContext,
    data: {
      id: number;
      description: string;
      active: boolean;
    },
  ) {
    await Database.transaction(async trx => {
      const item = await ProductivityItem.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('id', data.id)
        .first();

      if (!item) {
        throw this.shared.ResourceNotFound();
      }

      await item
        .merge({ description: data.description, active: data.active })
        .useTransaction(trx)
        .save();
    });
  }

  public async batchCreateItemProduct(
    authCtx: AuthContext,
    data: {
      items: {
        productivityItemId: number;
        productVariationId: string;
        quantity: number;
      }[];
    },
  ) {
    await Database.transaction(async trx => {
      const prodItems = await ProductivityItem.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .whereIn(
          'id',
          data.items.map(e => e.productivityItemId),
        );

      const tasks = prodItems.map(elem => {
        return elem.related('products').createMany(
          data.items
            .filter(inner => inner.productivityItemId === elem.id)
            .map(inner => ({
              economic_group_id: authCtx.group.id,
              product_variation_id: inner.productVariationId,
              quantity: inner.quantity,
            })),
          trx,
        );
      });

      await Promise.all(tasks);
    });
  }

  public async updateItemProduct(
    authCtx: AuthContext,
    data: {
      id: number;
      quantity: number;
      active: boolean;
    },
  ) {
    await Database.transaction(async trx => {
      const item = await ProductivityItemProduct.query()
        .useTransaction(trx)
        .where('economic_group_id', authCtx.group.id)
        .where('id', data.id)
        .first();

      if (!item) {
        throw this.shared.ResourceNotFound();
      }

      await item
        .merge({ quantity: data.quantity, active: data.active })
        .useTransaction(trx)
        .save();
    });
  }
}
