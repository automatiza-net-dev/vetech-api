import { BankingOriginFlag, BankingType } from 'App/Models/Banking';
import { DateTime } from 'luxon';

export interface IUpsertBankingData {
  clientId: string;
  accountPlanId: string;
  paymentMethodId: string;
  checkingAccountId: string;
  tefFlagId?: string;
  acquirerId?: string;
  type: BankingType;
  document: string;
  historic?: string;
  issueDate: DateTime;
  documentValue: number;
  feeValue: number;
  feePercentage: number;
  discountValue: number;
  discountPercentage: number;
  reconciled: boolean;
  originFlag: BankingOriginFlag;

  installment?: number;
  observation?: string;
  competenceDate?: string;
  fiscalNote?: string;
  userDocument?: string;
  nsuDocument?: string;
  barCode?: string;
}
