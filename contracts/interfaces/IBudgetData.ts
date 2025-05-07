import { BudgetStatus } from "App/Models/Budget";
import { DateTime } from "luxon";

export interface ICreateBudgetItemData {
	budgetId: string;
	productVariationId: string;
	quantity: number;
	saleValue: number;
	unitaryValue: number;
	discountValue: number;
	courtesy?: boolean;
	maxDiscount?: boolean;
	departmentId?: number;
	departmentItemId?: number;
	observation?: string;
}

export interface ICreateBudgetData {
	clientId?: string;
	sellerId?: string;
	reviewerId?: string;
	patientId?: string;
	dailyMovementId?: string;
	attendanceId?: number;
	scheduleId?: string;
	originBudgetId?: string;
	budgetRelatedTypeId?: number;
	internalCode?: string;
	budgetDate: DateTime;
	expirationDate: DateTime;
	observation?: string;
	internalObservation?: string;
	clientName?: string;
	maxDiscount: boolean;
	items: Array<Omit<ICreateBudgetItemData, "budgetId">>;
}

export interface IUpdateBudgetItemData {
	budgetItemId: string;
	quantity: number;
	unitaryValue: number;
	discountValue: number;
	courtesy?: boolean;
	maxDiscount?: boolean;
	status: BudgetStatus;
	internalCode?: string;
}

export interface IConfirmBudgetData {
	type: "PARCIAL" | "TOTAL";
	notConfirmedItems: string[];
	finishedAt: DateTime;
	reasonId?: string;
	clientId?: string;
	financialResponsibleId?: string;
	observation?: string;
	canceledObservation?: string;
	internalObservation?: string;
}

export interface ICancelBudgetData {
	reasonId: string;
	finishedAt: DateTime;
	canceledObservation?: string;
	internalObservation?: string;
}
