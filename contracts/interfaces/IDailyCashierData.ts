import { DateTime } from 'luxon';

export interface IOpenCashierData {
  dailyMovementId: string;
  userId: string;
  openingDate: DateTime;
  initialBalance: number;
}

export interface ICloseCashierData {
  userId: string;
  closingDate: DateTime;
  cashierTotal: number;
}

export interface ICheckCashierData {
  userId: string;
  checkingDate: DateTime;
  observations: string;
}

export interface IReviewCashierData {
  userId: string;
  revisionDate: DateTime;
  observations: string;
}

export interface ICreateCashierExpenseEntryData {
  entryDate: DateTime;
  value: number;
  description: string;
}
