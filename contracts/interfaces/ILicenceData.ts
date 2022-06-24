import { LicenceType } from 'App/Models/Licence';
import { DateTime } from 'luxon';

export default interface ILicenceData {
  business_unit_id: string;
  expiration_date: DateTime;
  type: LicenceType;
  plan_price_id?: string;
  licence_value?: number;
  active: boolean;
}
