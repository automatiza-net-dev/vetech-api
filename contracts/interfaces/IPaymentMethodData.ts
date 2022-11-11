import { PaymentMethodTef, PaymentMethodType } from 'App/Models/PaymentMethod';

export interface ICreatePaymentMethodData {
  description: string;
  requiresDocument: boolean;
  tef: PaymentMethodTef;
  automaticCancelation: boolean;
  daysFirstInstallment: number;
  daysBetweenInstallments: number;
  allowChangeExpirationDate: boolean;
  minimumInstallmentValue: number;
  type?: PaymentMethodType;
  checkingAccountId?: string;
  fee?: number;
  daysUntilTransfer?: number;
  installmentsWithoutPassword?: number;
  maxInstallments?: number;
}

export interface ICreatePaymentMethodFlagData {
  paymentMethodId: string;
  paymentMethodFlagId: string;
  paymentMethodAcquirerId: string;
  checkingAccountId?: string;
  maxInstallments?: number;
  fee?: number;
}
export interface ICreatePaymentMethodFeeData {
  paymentMethodId: string;
  paymentMethodFlagId: string;
  installments: number;
  fee: number;
}
