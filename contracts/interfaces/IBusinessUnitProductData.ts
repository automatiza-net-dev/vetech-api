import { BusinessUnitProductMetaType } from 'App/Models/BusinessUnitProduct';

export default interface IBusinessUnitProductData {
  productVariationId: string;
  stock: number;
  maximumStock: number;
  minimumStock: number;
  maximumDiscountPercentage: number;
  maximumDiscountValue: number;
  price: number;
  costPrice: number;
  profitMargin: number;
  commission: number;
  meta: number;
  metaType: BusinessUnitProductMetaType;
  commissionMeta: number;
}
