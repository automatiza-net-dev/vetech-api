import { ProductType } from 'App/Models/Product';

export default interface IUpdateProduct {
  description: string;
  type: ProductType;
  referenceCode: string;
  collectionYear: number;
  ncm?: string;
  cest?: string;
  features?: string;
  unitId: string;
  active: boolean;
  groupId?: string;
  subgroupId: string;
}
