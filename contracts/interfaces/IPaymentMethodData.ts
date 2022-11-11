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
  daysUntilTransfer?: number;
  installmentsWithoutPassword?: number;
  maxInstallments?: number;
}
