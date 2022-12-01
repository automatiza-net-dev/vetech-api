import {
  FinanceAccept,
  FinanceOriginDownFlag,
  FinanceOriginFlag,
  FinanceType,
} from 'App/Models/Finance';
import { DateTime } from 'luxon';

export interface IUpsertFinance {
  clientId: string;
  type: FinanceType;
  accountPlanId: string;
  paymentMethodId: string;
  document: string;
  historic: string;
  issueDate: DateTime;
  expirationDate: DateTime;
  originalValue: number;
  accept: FinanceAccept;
  installment: number;
  originFlag: FinanceOriginFlag;

  observation?: string;
  checkingAccountId?: string;
  paymentDate?: DateTime;
  downDate?: DateTime;
  paymentValue?: number;
  feeValue?: number;
  feePercentage?: number;
  discountValue?: number;
  discountPercentage?: number;
  increaseValue?: number;
  increasePercentage?: number;
  additionalValue?: number;
  additionalPercentage?: number;
  competenceDate?: string;
  fiscalNote?: string;
  userDocument?: string;
  nsuDocument?: string;
  barCode?: string;
  bank?: string;
  agency?: string;
  account?: string;
}

export interface IFinanceDownData {
  checkingAccountId: string;
  paymentDate: DateTime;
  paymentValue: number;
  originDownFlag: FinanceOriginDownFlag;
  feeValue?: number;
  feePercentage?: number;
  discountValue?: number;
  discountPercentage?: number;
  increaseValue?: number;
  increasePercentage?: number;
  observation?: string;
}

export interface IFinanceReversalData {
  reason: string;
  originDownFlag: FinanceOriginDownFlag;
}
