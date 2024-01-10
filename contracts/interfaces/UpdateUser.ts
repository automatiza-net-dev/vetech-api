import { DateTime } from "luxon";

export interface IUpdatePassword {
	name?: string;
	email?: string;
	password?: string;
	document?: string;
	phone?: string;
	postalCode?: string;
	address?: string;
	number?: string;
	complement?: string;
	district?: string;
	city?: string;
	state?: string;
	licensingJob?: string;
	inscription?: string;
	birthDate?: DateTime;
	onDuty?: boolean;
	saleDepositId?: number;
}
