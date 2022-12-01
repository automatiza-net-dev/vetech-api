import { BudgetStatus } from 'App/Models/Budget';
import { DateTime } from 'luxon';

export interface ICreateBudgetData {
  clientId: string;
  dailyMovementId: string;
  dailyCashierId: string;
  budgetDate: DateTime;
  expirationDate: DateTime;
  productValue: number;
  serviceValue: number;
  discountValue: number;
  observation: string;
}

export interface ICreateBudgetItemData {
  budgetId: string;
  productVariationId: string;
  quantity: number;
  unitaryValue: number;
  discountValue: number;
}

export interface IUpdateBudgetItemData {
  quantity: number;
  unitaryValue: number;
  discountValue: number;
  status: BudgetStatus;
}

export interface IConfirmBudgetData {
  billId: string;
  type: 'PARCIAL' | 'TOTAL';
  notConfirmedItems: string[];
  finishedAt: DateTime;
  reasonId?: string;
  canceledObservation?: string;
}

export interface ICancelBudgetData {
  reasonId: string;
  finishedAt: DateTime;
  canceledObservation: string;
}
