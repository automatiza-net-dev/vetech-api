import { PaymentMethodTef, PaymentMethodType } from 'App/Models/PaymentMethod';

export interface ICreatePaymentMethodData {
  description: string;
  requiresDocument: boolean;
  tef: PaymentMethodTef;
  automaticCancellation: boolean;
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
  active: boolean;
}

export interface ICreatePaymentMethodFlagData {
  paymentMethodId: string;
  tefFlagId: string;
  tefAcquirerId: string;
  checkingAccountId?: string;
  maxInstallments?: number;
  fee?: number;
}

export interface IUpdatePaymentMethodFlagData {
  tefAcquirerId: string;
  maxInstallments?: number;
  fee?: number;
  active: boolean;
}

export interface ICreatePaymentMethodFeeData {
  paymentMethodId: string;
  paymentMethodFlagId: string;
  installments: number;
  fee: number;
}
