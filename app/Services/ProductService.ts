import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Product from 'App/Models/Product';
import SharedService from 'App/Services/SharedService';
import IProductData from 'Contracts/interfaces/IProductData';

@inject()
export default class ProductService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string): Promise<Array<Product>> {
    const group = await this.sharedService.getUserGroup(unitId);

    return group.related('products').query();
  }

  public async show(unitId: string, id: string): Promise<Product> {
    const group = await this.sharedService.getUserGroup(unitId);

    const product = await group
      .related('products')
      .query()
      .where('id', id)
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

    return group.related('products').create({
      description: data.description,
      type: data.type,
      referenceCode: data.referenceCode,
      collectionYear: data.collectionYear,
      ncm: data.ncm,
      cest: data.cest,
      features: data.features,
      unityType: data.unityType,
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: IProductData,
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
      })
      .save();
  }

  public async destroy(unitId: string, id: string): Promise<void> {
    const product = await this.show(unitId, id);

    await product.softDelete();
  }
}
