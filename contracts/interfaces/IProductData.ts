import { ProductType } from 'App/Models/Product';
import IBusinessUnitProductData from 'Contracts/interfaces/IBusinessUnitProductData';

export interface IProductDataVariation {
  barcode: string;
  price: Omit<
    IBusinessUnitProductData,
    'productVariationId' | 'stock' | 'businessUnitId'
  >;
  specificPrice?: Array<{
    business: string;
    price: Omit<
      IBusinessUnitProductData,
      'productVariationId' | 'stock' | 'businessUnitId'
    >;
  }>;
  variation_options?: Array<string>;
}

export default interface IProductData {
  description: string;
  type: ProductType;
  referenceCode: string;
  collectionYear: number;
  ncm?: string;
  cest?: string;
  features?: string;
  unitId?: string;
  active: boolean;
  variationGroup: string;
  groupId?: string;
  subgroupId: string;
  variations: Array<IProductDataVariation>;
}
