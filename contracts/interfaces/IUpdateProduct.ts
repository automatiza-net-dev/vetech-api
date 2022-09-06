import { ProductType } from 'App/Models/Product';

export default interface IUpdateProduct {
  description: string;
  type: ProductType;
  referenceCode: string;
  collectionYear: number;
  ncm?: string;
  cest?: string;
  features?: string;
  unityType?: string;
  active: boolean;
  groupId?: string;
  subgroupId: string;
}
