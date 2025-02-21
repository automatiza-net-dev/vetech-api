import { DateTime } from "luxon";

export interface ICreateBillData {
	clientId: string;
	financialResponsibleId?: string;
	patientId?: string;
	dailyMovementId?: string;
	scheduleId?: string;
	billDate: DateTime;

	items: Array<{
		productVariationId: string;
		quantity: number;
		unitaryValue: number;
		discountValue: number;
		courtesy?: boolean;
		maxDiscount?: boolean;
		approved?: boolean;
	}>;

	additionalInformation?: string;
	budgetId?: string;

	internalCode?: string;
	originBillId?: string;
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
	paymentMethodFlagId?: string;
	paymentMethodFlagInstallmentId?: number;
	budgetPaymentId?: number;

	maxParcelas?: boolean;
	expirationDate: DateTime;
	installmentsValue: number;
	nsuDocument?: string;
	installments?: number;
}

export interface IUpdateBillItemData {
	items: Array<{
		billItemId: string;
		unitaryValue: number;
		discountValue: number;
		courtesy: boolean;
		maxDiscount?: boolean;
		shouldValidateDiscount?: boolean;
		approved?: boolean;
	}>;
}

export interface IUpdateBillData {
	billId: string;
	sellerId: string;
	clientId: string;
	patientId?: string;
	financialResponsibleId?: string;
	maxDiscount?: boolean;
	additionalInformation?: string;
	internalCode?: string;
	items?: {
		billItemId?: string;
		productVariationId: string;
		quantity: number;
		unitaryValue: number;
		discountValue: number;
		// saleValue: number;
		courtesy: boolean;
		maxDiscount?: boolean;
		// shouldValidateDiscount?: boolean;
	}[];
}
