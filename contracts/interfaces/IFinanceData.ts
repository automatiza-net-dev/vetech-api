import {
	FinanceAccept,
	FinanceOriginDownFlag,
	FinanceOriginFlag,
	FinanceType,
} from "App/Models/Finance";
import { DateTime } from "luxon";

export interface IUpsertFinance {
	type: FinanceType;
	accountPlanId: string;
	paymentMethodId: string;
	document: string;
	historic?: string;
	issueDate: DateTime;
	expirationDate: DateTime;
	originalValue: number;
	accept: FinanceAccept;
	installment: number;
	originFlag: FinanceOriginFlag;
	qtyInstallments?: number;

	clientId?: string;
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
	tefFlagId?: string;
	tefAcquirerId?: string;
}

export interface IUpdateFinance {
	accountPlanId: string;
	paymentMethodId: string;
	historic?: string;
	expirationDate: DateTime;
	originalValue: number;
	reconciled: boolean;

	issueDate?: DateTime;
	checkingAccountId?: string;
	feeValue?: number;
	feePercentage?: number;
	discountValue?: number;
	discountPercentage?: number;
	increaseValue?: number;
	increasePercentage?: number;
	observation?: string;
	competenceDate?: string;
	fiscalNote?: string;
	userDocument?: string;
	nsuDocument?: string;
	barCode?: string;
	bank?: string;
	agency?: string;
	account?: string;
	tefFlagId?: string;
	tefAcquirerId?: string;
}

export interface IFinanceDownData {
	financeId: string;
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

	competenceDate?: string;
	fiscalNote?: string;
	userDocument?: string;
	nsuDocument?: string;
	barCode?: string;
	bank?: string;
	agency?: string;
	account?: string;
	tefFlagId?: string;
	tefAcquirerId?: string;
}

export interface IFinanceReversalData {
	reason: string;
	originDownFlag: FinanceOriginDownFlag;
}
