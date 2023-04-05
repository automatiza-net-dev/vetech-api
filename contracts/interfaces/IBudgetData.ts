import { BudgetStatus } from 'App/Models/Budget';
import { DateTime } from 'luxon';

export interface ICreateBudgetItemData {
  budgetId: string;
  productVariationId: string;
  quantity: number;
  unitaryValue: number;
  discountValue: number;
}

export interface ICreateBudgetData {
  clientId: string;
  patientId: string;
  dailyMovementId: string;
  budgetDate: DateTime;
  expirationDate: DateTime;
  observation?: string;
  items: Array<Omit<ICreateBudgetItemData, 'budgetId'>>;
}

export interface IUpdateBudgetItemData {
  quantity: number;
  unitaryValue: number;
  discountValue: number;
  status: BudgetStatus;
}

export interface IConfirmBudgetData {
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
