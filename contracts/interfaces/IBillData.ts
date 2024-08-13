import { DateTime } from "luxon";

export interface ICreateBillData {
	clientId: string;
	financialResponsibleId?: string;
	patientId?: string;
	dailyMovementId?: string;
	billDate: DateTime;

	items: Array<{
		productVariationId: string;
		quantity: number;
		unitaryValue: number;
		discountValue: number;
		courtesy?: boolean;
		maxDiscount?: boolean;
	}>;

	additionalInformation?: string;
	budgetId?: string;
}

export interface ICreateBillItemData {
	billId: string;
	productVariationId: string;
	quantity: number;
	unitaryValue: number;
	discountValue: number;
	courtesy?: boolean;
	maxDiscount?: boolean;
}

export interface ICreateBillPaymentData {
	billId: string;
	flagId?: string;
	acquirerId?: string;
	paymentMethodId: string;
	paymentMethodFlagInstallmentId?: number;
	budgetPaymentId?: number;

	expirationDate: DateTime;
	installmentsValue: number;
	nsuDocument?: string;
	installments?: number;
}

export interface IUpdateBillItemData {
	items: Array<{ billItemId: string; discountValue: number }>;
}
