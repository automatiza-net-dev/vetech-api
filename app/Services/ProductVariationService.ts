import { inject } from '@adonisjs/fold';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import ProductVariation from 'App/Models/ProductVariation';
import ProductService from 'App/Services/ProductService';
import SharedService from 'App/Services/SharedService';
import IProductVariationData from 'Contracts/interfaces/IProductVariationData';

@inject()
export default class ProductVariationService {
  constructor(
    private readonly productService: ProductService,
    private readonly sharedService: SharedService,
  ) {}

  public async index(unitId: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const products = await group
      .related('products')
      .query()
      .preload('variations');

    return products.map(p => p.variations).flat();
  }

  public async show(unitId: string, id: string): Promise<ProductVariation> {
    const group = await this.sharedService.getUserGroup(unitId);

    const products = await group.related('products').query();

    const variation = await ProductVariation.query()
      .where('id', id)
      .andWhereIn(
        'product_id',
        products.map(p => p.id),
      )
      .preload('businessUnitProducts')
      .first();

    if (!variation) {
      throw this.sharedService.ResourceNotFound();
    }

    return variation;
  }

  public async store(
    unitId: string,
    data: Omit<IProductVariationData, 'active'> & { options: Array<string> },
  ) {
    const product = await this.productService.show(unitId, data.productId);

    const firstVariation = await ProductVariation.query()
      .where('product_id', product.id)
      .preload('businessUnitProducts')
      .first();

    const trx = await Database.transaction();

    try {
      const newVariation = await product.related('variations').create(
        {
          barcode: data.barcode,
        },
        {
          client: trx,
        },
      );

      await newVariation
        .related('variationOptions')
        .sync(data.options, false, trx);

      if (firstVariation) {
        const data = firstVariation.businessUnitProducts.map(bup => ({
          businness_unit_id: bup.businness_unit_id,
          stock: 0,
          price: bup.price,
          costPrice: bup.costPrice,
          maximumStock: bup.maximumStock,
          minimumStock: bup.minimumStock,
          maximumDiscountPercentage: bup.maximumDiscountPercentage,
          maximumDiscountValue: bup.maximumDiscountValue,
          profitMargin: bup.profitMargin,
          commission: bup.commission,
          commissionMeta: bup.commissionMeta,
          meta: bup.meta,
          metaType: bup.metaType,
        }));

        await newVariation
          .related('businessUnitProducts')
          .createMany(data, trx);
      }

      await trx.commit();

      return newVariation;
    } catch (error) {
      await trx.rollback();
      Logger.error(error.message);
      throw new InternalErrorException(
        'Erro na execução',
        500,
        'E_INTERNAL_ERROR',
      );
    }
  }

  public async update(unitId: string, id: string, data: IProductVariationData) {
    const variation = await this.show(unitId, id);

    if (data.productId !== variation.product_id) {
      const newProduct = await this.productService.show(unitId, data.productId);
      variation.product_id = newProduct.id;
    }

    return variation
      .merge({
        barcode: data.barcode,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const variation = await this.show(unitId, id);

    await variation.softDelete();
  }
}
