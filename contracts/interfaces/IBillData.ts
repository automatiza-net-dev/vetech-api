import { DateTime } from 'luxon';

export interface ICreateBillData {
  clientId: string;
  patientId?: string;
  dailyMovementId?: string;
  dailyCashierId?: string;
  billDate: DateTime;

  items: Array<{
    productVariationId: string;
    quantity: number;
    unitaryValue: number;
    discountValue: number;
  }>;

  additionalInformation?: string;
  budgetId?: string;
}

export interface ICreateBillItemData {
  billId: string;
  productVariationId: string;
  quantity: number;
  unitaryValue: number;
  discountValue: number;
}

export interface ICreateBillPaymentData {
  billId: string;
  flagId?: string;
  acquirerId?: string;
  paymentMethodId: string;
  paymentMethodFlagInstallmentId?: number;
  expirationDate: DateTime;
  installmentsValue: number;
  nsuDocument?: string;
}

export interface IUpdateBillItemData {
  items: Array<{ billItemId: string; discountValue: number }>;
}
