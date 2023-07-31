import { DateTime } from 'luxon';

export default interface IKitData {
  description: string;
  fromExpiration?: DateTime;
  toExpiration?: DateTime;
  active: boolean;
}

export interface IUpsertKitItemData {
  kitId: number;
  productVariationId: string;
  quantity: number;
  discountPrice: number;
  discountPercentage: number;
}
