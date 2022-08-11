import { inject } from '@adonisjs/fold';
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
      .first();

    if (!variation) {
      throw this.sharedService.ResourceNotFound();
    }

    return variation;
  }

  public async store(
    unitId: string,
    data: Omit<IProductVariationData, 'active'>,
  ) {
    const product = await this.productService.show(unitId, data.productId);

    return product.related('variations').create({
      barcode: data.barcode,
    });
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
