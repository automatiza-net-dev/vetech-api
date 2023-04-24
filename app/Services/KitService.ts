import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import BusinessUnit from 'App/Models/BusinessUnit';
import Kit from 'App/Models/Kit';
import KitItem from 'App/Models/KitItem';
import ProductVariation from 'App/Models/ProductVariation';
import SharedService from 'App/Services/SharedService';
import IKitData, { IUpsertKitItemData } from 'Contracts/interfaces/IKitData';

interface ISearch {
  description?: string;
}

@inject()
export default class KitService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch) {
    const qb = Kit.query().where('business_unit_id', unitId);

    if (data.description) {
      qb.where('description', 'like', `%${data.description}%`);
    }

    return qb;
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
        business_unit_id: unit.id,
        economic_group_id: unit.economicGroupId,
      });
    });
  }

  public async show(unitId: string, id: string) {
    const ent = await Kit.query()
      .where('id', id)
      .andWhere('business_unit_id', unitId)
      .first();

    if (!ent) {
      throw this.sharedService.ResourceNotFound();
    }

    return ent;
  }

  public async update(unitId: string, id: string, data: IKitData) {
    const entity = await this.show(unitId, id);

    return entity
      .merge({
        description: data.description,
        fromExpiration: data.fromExpiration,
        toExpiration: data.toExpiration,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const entity = await this.show(unitId, id);

    return entity.delete();
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

      await kit.related('items').query().useTransaction(trx).delete();

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
}
