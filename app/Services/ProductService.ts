import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Product, { ProductType } from 'App/Models/Product';
import SharedService from 'App/Services/SharedService';
import IProductData from 'Contracts/interfaces/IProductData';

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

    const qb = group.related('products').query();

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
