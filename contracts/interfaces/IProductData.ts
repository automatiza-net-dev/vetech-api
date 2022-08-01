import { ProductType } from 'App/Models/Product';
import IBusinessUnitProductData from 'Contracts/interfaces/IBusinessUnitProductData';

export interface IProductDataVariation {
  barcode: string;
  price: Omit<IBusinessUnitProductData, 'productVariationId' | 'stock'>;
  specificPrice?: Array<{
    business: string;
    price: Omit<IBusinessUnitProductData, 'productVariationId' | 'stock'>;
  }>;
  variation_options?: Array<string>;
}

export default interface IProductData {
  description: string;
  type: ProductType;
  referenceCode: string;
  collectionYear: number;
  ncm: string;
  cest: string;
  features: string;
  unityType: string;
  active: boolean;
  group?: string;
  variations: Array<IProductDataVariation>;
}
