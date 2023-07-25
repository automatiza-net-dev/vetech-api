import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import BusinessUnit from 'App/Models/BusinessUnit';
import Kit from 'App/Models/Kit';
import KitItem from 'App/Models/KitItem';
import ProductVariation from 'App/Models/ProductVariation';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import IKitData, { IUpsertKitItemData } from 'Contracts/interfaces/IKitData';
import { DateTime } from 'luxon';

interface ISearch {
  id?: string;
  productCode?: string;
  description?: string;
  // fromExpiration?: string;
  // toExpiration?: string;
  active?: number;
}

@inject()
export default class KitService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = Kit.query()
      .where('economic_group_id', group.id)
      .whereRaw(
        '((from_expiration is null or to_expiration is null) or (now() between from_expiration and to_expiration))',
        [],
      )
      .where('active', true);

    if (data.id) {
      qb.where('id', data.id);
    }

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    // if (data.fromExpiration) {
    //   qb.whereRaw('(from_expiration >= ? or from_expiration is null)', [
    //     data.fromExpiration,
    //   ]);
    // }
    //
    // if (data.toExpiration) {
    //   qb.whereRaw('(to_expiration <= ? or to_expiration is null)', [
    //     data.toExpiration,
    //   ]);
    // }
    //
    // if (!data.fromExpiration && !data.toExpiration) {
    //   qb.whereRaw('(from_expiration is null or to_expiration is null)');
    // }

    if (data.productCode) {
      qb.whereHas('items', query => {
        query.whereHas('productVariation', query => {
          query.whereHas('product', query => {
            query.where('reference_code', 'ilike', `%${data.productCode}%`);
          });
        });
      });
    }

    qb.preload('items', query => {
      query.where('business_unit_id', unitId);
      query.preload('productVariation', query => {
        query.preload('product');
      });
    });

    const result = await qb;

    return result.map(elem => {
      return {
        id: elem.id,
        description: elem.description,
        fromExpiration: elem.fromExpiration,
        toExpiration: elem.toExpiration,
        active: elem.active,
        sum: {
          originalPrice: elem.items.reduce(
            (acc, curr) => acc + curr.originalPrice * curr.quantity,
            0,
          ),
          discountPrice: elem.items.reduce(
            (acc, curr) => acc + curr.discountPrice,
            0,
          ),
          salePrice: elem.items.reduce((acc, curr) => acc + curr.salePrice, 0),
        },
        items: elem.items,
      };
    });
  }

  public async store(unitId: string, data: Omit<IKitData, 'active'>) {
    return Database.transaction(async trx => {
      const unit = await BusinessUnit.findOrFail(unitId, {
        client: trx,
      });

      return Kit.create({
        description: data.description,
        fromExpiration: data.fromExpiration,
        toExpiration: data.toExpiration,
        economic_group_id: unit.economicGroupId,
      });
    });
  }

  public async show(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const ent = await Kit.query()
      .where('id', id)
      .andWhere('economic_group_id', group.id)
      .preload('items', query => {
        query.preload('businessUnit');
        query.preload('productVariation', query => {
          query.preload('product');
        });
      })
      .first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    return {
      id: ent.id,
      description: ent.description,
      from_expiration: ent.fromExpiration,
      to_expiration: ent.toExpiration,
      active: ent.active,
      items: ent.items.map(item => ({
        id: item.id,
        unit: {
          id: item.businessUnit.id,
          identification: item.businessUnit.identification,
        },
        product: {
          variation_id: item.productVariation.id,
          product_id: item.productVariation.product_id,
          description: item.productVariation.product.description,
          quantity: item.quantity,
          original_price: item.originalPrice,
          discount_price: item.discountPrice,
          discount_percentage: item.discountPercentage,
          sale_price: item.salePrice,
          active: item.active,
        },
      })),
    };
  }

  public async update(unitId: string, id: string, data: IKitData) {
    const group = await this.sharedService.getUserGroup(unitId);

    const ent = await Kit.query()
      .where('id', id)
      .andWhere('economic_group_id', group.id)
      .first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent
      .merge({
        description: data.description,
        fromExpiration: data.fromExpiration,
        toExpiration: data.toExpiration,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const ent = await Kit.query()
      .where('id', id)
      .andWhere('economic_group_id', group.id)
      .preload('items', query => {
        query.preload('businessUnit');
        query.preload('productVariation', query => {
          query.preload('product');
        });
      })
      .first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent.delete();
  }

  public async addItemToKit(unitId: string, data: IUpsertKitItemData) {
    return Database.transaction(async trx => {
      const rootUnit = await BusinessUnit.findOrFail(unitId, {
        client: trx,
      });
      const variation = await ProductVariation.query()
        .useTransaction(trx)
        .where('id', data.productVariationId)
        .preload('product')
        .preload('businessUnitProducts')
        .firstOrFail();

      const allUnits = await BusinessUnit.query()
        .useTransaction(trx)
        .where('economic_group_id', rootUnit.economicGroupId)
        .where('active', true);

      const kit = await Kit.findOrFail(data.kitId, {
        client: trx,
      });

      await kit.related('items').createMany(
        allUnits.map(unit => {
          const originalPrice = variation.businessUnitProducts.find(
            bup => bup.businness_unit_id === unit.id,
          )?.price;
          if (!originalPrice) {
            throw new BadRequestException(
              `Não existe preço para o produto na unidade ${unit.companyName}`,
              400,
              'E_NO_PRICE',
            );
          }

          return {
            product_variation_id: data.productVariationId,
            business_unit_id: unit.id,

            quantity: data.quantity,
            discountPrice: data.discountPrice,
            discountPercentage: data.discountPercentage,
            salePrice: data.quantity * originalPrice - data.discountPrice,
            originalPrice,
          };
        }),
        {
          client: trx,
        },
      );
    });
  }

  public async updateItemToKit(
    unitId: string,
    itemId: string,
    data: Omit<IUpsertKitItemData, 'kitId'>,
  ) {
    return Database.transaction(async trx => {
      const rootUnit = await BusinessUnit.findOrFail(unitId, {
        client: trx,
      });
      const variation = await ProductVariation.query()
        .useTransaction(trx)
        .where('id', data.productVariationId)
        .preload('product')
        .preload('businessUnitProducts')
        .firstOrFail();

      const allUnits = await BusinessUnit.query()
        .useTransaction(trx)
        .where('economic_group_id', rootUnit.economicGroupId)
        .where('active', true);

      const kitItem = await KitItem.query()
        .useTransaction(trx)
        .where('id', itemId)
        .firstOrFail();

      const kit = await Kit.query()
        .useTransaction(trx)
        .where('id', kitItem.kit_id)
        .preload('items')
        .firstOrFail();

      await kit
        .related('items')
        .query()
        .useTransaction(trx)
        .where('product_variation_id', data.productVariationId)
        .delete();

      await kit.related('items').createMany(
        allUnits.map(unit => {
          const originalPrice = variation.businessUnitProducts.find(
            bup => bup.businness_unit_id === unit.id,
          )?.price;
          if (!originalPrice) {
            throw new BadRequestException(
              `Não existe preço para o produto na unidade ${unit.companyName}`,
              400,
              'E_NO_PRICE',
            );
          }

          return {
            product_variation_id: data.productVariationId,
            business_unit_id: unit.id,

            quantity: data.quantity,
            discountPrice: data.discountPrice,
            discountPercentage: data.discountPercentage,
            salePrice: data.quantity * originalPrice - data.discountPrice,
            originalPrice,
          };
        }),
        {
          client: trx,
        },
      );
    });
  }

  public async deleteItemToKit(authCtx: AuthContext, itemId: string) {
    return Database.transaction(async trx => {
      const kitItem = await KitItem.query()
        .useTransaction(trx)
        .where('business_unit_id', authCtx.unit.id)
        .where('id', itemId)
        .first();

      if (!kitItem) {
        throw this.sharedService.ResourceNotFound();
      }

      await kitItem.delete();
    });
  }
}
