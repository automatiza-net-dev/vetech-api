import {
	CheckingAccountOperation,
	CheckingAccountType,
} from "App/Models/CheckingAccount";

export interface IOpenCheckingAccountData {
	description: string;
	type: CheckingAccountType;

	accountNumber?: string;
	bankCode?: string;
	bankName?: string;
	agency?: string;
	businessUnitId?: string;
	agencyPhone?: string;
	managerName?: string;
	managerPhone?: string;
	managerEmail?: string;
	limit?: number;
}

export interface IUpdateCheckingAccountData {
	description: string;
	active: boolean;

	bankCode?: string;
	bankName?: string;
	agency?: string;
	businessUnitId?: string | null;
	agencyPhone?: string;
	managerName?: string;
	managerPhone?: string;
	managerEmail?: string;
	limit?: number;
	type?: CheckingAccountType;
}

export interface IUpdateCheckingAccountBalanceData {
	amount: number;
	operation: CheckingAccountOperation;
}
