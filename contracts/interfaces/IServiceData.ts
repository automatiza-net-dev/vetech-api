import { BusinessUnitProductMetaType } from 'App/Models/BusinessUnitProduct';
import { PServiceType } from 'App/Models/Product';

interface IPrice {
  price: number;
  profitMargin?: number;
  costPrice?: number;
  maximumDiscountPercentage?: number;
  maximumDiscountValue?: number;
  commission?: number;
  meta?: number;
  metaType?: BusinessUnitProductMetaType;
  commissionMeta?: number;
}

export default interface IServiceData {
  description: string;
  referenceCode?: string;
  subgroupId: string;

  features?: string;
  serviceCode: string;

  taxationGroupId: string;
  unitId?: string;
  serviceType?: typeof PServiceType[number];

  price: IPrice;
}

export interface IUpdateService {
  description: string;
  referenceCode?: string;
  subgroupId: string;
  serviceCode: string;
  active: boolean;

  features?: string;
  taxationGroupId: string;
  unitId?: string;
  serviceType?: typeof PServiceType[number];
}
