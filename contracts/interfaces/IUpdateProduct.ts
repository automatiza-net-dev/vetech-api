import { ProductIcmsOrigin, ProductPurpose } from 'App/Models/Product';

export default interface IUpdateProduct {
  description: string;
  referenceCode?: string;
  collectionYear?: number;
  ncm?: string;
  cest?: string;
  features?: string;
  unitId?: string;
  active: boolean;
  groupId?: string;
  subgroupId: string;
  taxationGroupId: string;
  icmsOrigin: typeof ProductIcmsOrigin[number];
  brandId?: string;
  taxBenefitCode?: string;
  anvisaCode?: string;
  purpose: ProductPurpose;
}
