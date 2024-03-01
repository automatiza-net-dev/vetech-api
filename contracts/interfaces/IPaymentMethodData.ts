import {
	PaymentMethodTef,
	PaymentMethodType,
	PaymentMethodUsage,
} from "App/Models/PaymentMethod";

export interface ICreatePaymentMethodData {
	description: string;
	requiresDocument: boolean;
	tef: PaymentMethodTef;
	automaticCancellation: boolean;
	daysFirstInstallment: number;
	daysBetweenInstallments: number;
	allowChangeExpirationDate: boolean;
	minimumInstallmentValue: number;
	usage: PaymentMethodUsage;

	type?: PaymentMethodType;
	checkingAccountId?: string;
	fee?: number;
	daysUntilTransfer?: number;
	installmentsWithoutPassword?: number;
	maxInstallments?: number;

	active: boolean;
}

export interface ICreatePaymentMethodFlagData {
	paymentMethodId: string;
	tefFlagId: string;
	tefAcquirerId: string;
	checkingAccountId?: string;
	maxInstallments?: number;
	daysUntilTransfer?: number;
}

export interface IUpdatePaymentMethodFlagData {
	tefAcquirerId: string;
	maxInstallments?: number;
	daysUntilTransfer?: number;
	active: boolean;
}

export interface ICreatePaymentMethodFeeData {
	paymentMethodId: string;
	paymentMethodFlagId: string;
	installments: number;
	fee: number;
}
