import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import BusinessUnitProduct from 'App/Models/BusinessUnitProduct';
import ProductVariationService from 'App/Services/ProductVariationService';
import IBusinessUnitProductData from 'Contracts/interfaces/IBusinessUnitProductData';

@inject()
export default class BusinessUnitProductService {
  constructor(private readonly productService: ProductVariationService) {}

  public async index(unitId: string) {
    return BusinessUnitProduct.query().where('businness_unit_id', unitId);
  }

  public async show(_: string, id: string) {
    const product = await BusinessUnitProduct.query()
      .andWhere('id', id)
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

  public async store(unitId: string, data: IBusinessUnitProductData) {
    const product = await this.productService.show(
      unitId,
      data.productVariationId,
    );

    return product.related('businessUnitProducts').create({
      businness_unit_id: data.businessUnitId,
      stock: data.stock,
      price: data.price,
      costPrice: data.costPrice,
      maximumStock: data.maximumStock,
      minimumStock: data.minimumStock,
      maximumDiscountPercentage: data.maximumDiscountPercentage,
      maximumDiscountValue: data.maximumDiscountValue,
      profitMargin: data.profitMargin,
      commission: data.commission,
      commissionMeta: data.commissionMeta,
      meta: data.meta,
      metaType: data.metaType,
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: IBusinessUnitProductData,
  ) {
    const product = await this.show(unitId, id);

    return product
      .merge({
        stock: data.stock,
        price: data.price,
        costPrice: data.costPrice,
        maximumStock: data.maximumStock,
        minimumStock: data.minimumStock,
        maximumDiscountPercentage: data.maximumDiscountPercentage,
        maximumDiscountValue: data.maximumDiscountValue,
        profitMargin: data.profitMargin,
        commission: data.commission,
        commissionMeta: data.commissionMeta,
        meta: data.meta,
        metaType: data.metaType,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const product = await this.show(unitId, id);

    await product.softDelete();
  }
}
