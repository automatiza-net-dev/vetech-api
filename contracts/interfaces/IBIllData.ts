import { DateTime } from 'luxon';

export interface ICreateBillData {
  clientId: string;
  dailyMovementId: string;
  dailyCashierId: string;
  billDate: DateTime;
  productValue: number;
  serviceValue: number;
  discountValue: number;

  otherValue?: number;
  additionalInformation?: string;
  budgetId?: string;
}

export interface ICreateBillItemData {
  billId: string;
  productVariationId: string;
  taxationGroupRuleId: string;
  quantity: number;
  costValue: number;
  saleValue: number;
  unitaryValue: number;
  discountValue: number;
}

export interface ICreateBillPaymentData {
  billId: string;
  paymentMethodId: string;
  expirationDate: DateTime;
  installmentValue: number;
}
