import { inject } from '@adonisjs/fold';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import BusinessUnit from 'App/Models/BusinessUnit';
import VariationGroup from 'App/Models/VariationGroup';
import Product, { ProductType } from 'App/Models/Product';
import SharedService from 'App/Services/SharedService';
import IProductData, {
  IProductDataVariation,
} from 'Contracts/interfaces/IProductData';
import IUpdateProduct from 'Contracts/interfaces/IUpdateProduct';

interface ISearch {
  description?: string;
  type?: ProductType;
  reference?: string;
  collection?: number;
}

@inject()
export default class ProductService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch): Promise<Array<Product>> {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = group.related('products')
      .query()
      .preload('group')
      .preload('subgroup');

    if (data.description) {
      qb.where('description', 'like', `%${data.description}%`);
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    if (data.reference) {
      qb.where('reference_code', 'like', `%${data.reference}%`);
    }

    if (data.collection) {
      qb.where('collection_year', data.collection);
    }

    return qb;
  }

  public async show(unitId: string, id: string): Promise<Product> {
    const group = await this.sharedService.getUserGroup(unitId);

    const product = await group
      .related('products')
      .query()
      .where('id', id)
      .preload('group')
      .preload('subgroup')
      .first();

    if (!product) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return product;
  }

  public async store(
    unitId: string,
    data: Omit<IProductData, 'active'>,
  ): Promise<Product> {
    const group = await this.sharedService.getUserGroup(unitId);
    const businessUnits = await BusinessUnit.query().where(
      'economic_group_id',
      group.id,
    );

    const variationGroup = await VariationGroup.findOrFail(data.variationGroup);

    const trx = await Database.transaction();

    try {
      const product = await Product.create(
        {
          description: data.description,
          type: data.type,
          referenceCode: data.referenceCode,
          collectionYear: data.collectionYear,
          ncm: data.ncm,
          cest: data.cest,
          features: data.features,
          unityType: data.unityType,
          economic_group_id: group.id,
          variation_group_id: variationGroup.id,
          group_id: data.groupId,
          subgroup_id: data.subgroupId,
        },
        {
          client: trx,
        },
      );

      // eslint-disable-next-line no-restricted-syntax
      for await (const variation of data.variations) {
        // product_variations
        const prodVariation = await product.related('variations').create(
          {
            barcode: variation.barcode,
          },
          {
            client: trx,
          },
        );

        await prodVariation
          .related('variationOptions')
          .sync(variation.variation_options ?? []);

        // eslint-disable-next-line no-restricted-syntax
        for await (const unit of businessUnits) {
          const unitPrice = this.checkForPrice(unit, variation);

          // business_unit_products
          await prodVariation.related('businessUnitProducts').create(
            {
              businness_unit_id: unit.id,
              stock: 0,
              price: unitPrice.price,
              costPrice: unitPrice.costPrice,
              maximumStock: unitPrice.maximumStock,
              minimumStock: unitPrice.minimumStock,
              maximumDiscountPercentage: unitPrice.maximumDiscountPercentage,
              maximumDiscountValue: unitPrice.maximumDiscountValue,
              profitMargin: unitPrice.profitMargin,
            },
            {
              client: trx,
            },
          );
        }
      }

      await trx.commit();

      return product;
    } catch (e) {
      Logger.error(e);
      await trx.rollback();

      throw new InternalErrorException(
        'Erro na execução',
        500,
        'E_INTERNAL_ERROR',
      );
    }
  }

  public async update(
    unitId: string,
    id: string,
    data: IUpdateProduct,
  ): Promise<Product> {
    const product = await this.show(unitId, id);

    return product
      .merge({
        description: data.description,
        type: data.type,
        referenceCode: data.referenceCode,
        collectionYear: data.collectionYear,
        ncm: data.ncm,
        cest: data.cest,
        features: data.features,
        unityType: data.unityType,
        active: data.active,
        group_id: data.groupId,
        subgroup_id: data.subgroupId,
      })
      .save();
  }

  public async destroy(unitId: string, id: string): Promise<void> {
    const product = await this.show(unitId, id);

    await product.softDelete();
  }

  private checkForPrice(unit: BusinessUnit, data: IProductDataVariation) {
    if (!data.specificPrice || data.specificPrice.length === 0) {
      return data.price;
    }

    const specificPrice = data.specificPrice.find(f => f.business === unit.id);

    if (specificPrice) return specificPrice.price;

    return data.price;
  }
}
