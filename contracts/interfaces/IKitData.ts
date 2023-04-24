import { DateTime } from 'luxon';

export default interface IKitData {
  description: string;
  fromExpiration: DateTime;
  toExpiration: DateTime;
  active: boolean;
}
