import { LicenceType } from 'App/Models/Licence';

export default interface ILicenceData {
  business_unit_id: string;
  expirationDate: Date;
  type: LicenceType;
  plan_price_id?: string;
  licence_value?: number;
  active: boolean;
}
