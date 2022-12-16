import { BusinessUnitProductMetaType } from 'App/Models/BusinessUnitProduct';
import { ProductIcmsOrigin, ProductType } from 'App/Models/Product';

interface IPrice {
  maximumStock: number;
  minimumStock: number;
  maximumDiscountPercentage: number;
  maximumDiscountValue: number;
  price: number;
  costPrice?: number;
  profitMargin?: number;
  commission: number;
  meta: number;
  metaType: BusinessUnitProductMetaType;
  commissionMeta: number;
}

export interface IProductDataVariation {
  barcode?: string;
  price: IPrice;
  specificPrice?: Array<{
    business: string;
    price: IPrice;
  }>;
  variation_options?: Array<string>;
}

export default interface IProductData {
  description: string;
  type: ProductType;
  referenceCode: string;
  collectionYear?: number;
  ncm?: string;
  cest?: string;
  features?: string;
  unitId?: string;
  icmsOrigin?: typeof ProductIcmsOrigin[number];
  active: boolean;
  variationGroup: string;
  taxationGroupId: string;
  groupId?: string;
  subgroupId: string;
  variations: Array<IProductDataVariation>;
}
