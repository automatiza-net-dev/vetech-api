import { BudgetStatus } from "App/Models/Budget";
import { DateTime } from "luxon";

export interface ICreateBudgetItemData {
	budgetId: string;
	productVariationId: string;
	quantity: number;
	saleValue: number;
	unitaryValue: number;
	discountValue: number;
}

export interface ICreateBudgetData {
	clientId?: string;
	sellerId?: string;
	reviewerId?: string;
	patientId?: string;
	dailyMovementId?: string;
	attendanceId?: number;
	budgetDate: DateTime;
	expirationDate: DateTime;
	observation?: string;
	internalObservation?: string;
	clientName?: string;
	items: Array<Omit<ICreateBudgetItemData, "budgetId">>;
}

export interface IUpdateBudgetItemData {
	quantity: number;
	unitaryValue: number;
	discountValue: number;
	status: BudgetStatus;
}

export interface IConfirmBudgetData {
	type: "PARCIAL" | "TOTAL";
	notConfirmedItems: string[];
	finishedAt: DateTime;
	reasonId?: string;
	clientId?: string;
	canceledObservation?: string;
	internalObservation?: string;
}

export interface ICancelBudgetData {
	reasonId: string;
	finishedAt: DateTime;
	canceledObservation?: string;
	internalObservation?: string;
}
