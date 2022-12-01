import { BankingOriginFlag, BankingType } from 'App/Models/Banking';
import { DateTime } from 'luxon';

export interface IUpsertBankingData {
  clientId: string;
  type: BankingType;
  accountPlanId: string;
  paymentMethodId: string;
  checkingAccountId: string;
  document: string;
  historic: string;
  issueDate: DateTime;
  documentValue: number;
  feeValue: number;
  feePercentage: number;
  discountValue: number;
  discountPercentage: number;
  reconciled: boolean;
  installment: number;
  originFlag: BankingOriginFlag;

  observation?: string;
  competenceDate?: string;
  fiscalNote?: string;
}
