import { TUnitStatus } from "App/Models/BusinessUnit";

export interface IUpdateBusinessUnit {
	identification?: string;
	fantasyName?: string;
	companyName?: string;
	email?: string;
	document?: string;
	phone?: string;
	postalCode?: string;
	address?: string;
	number?: string;
	complement?: string;
	district?: string;
	city?: string;
	state?: string;
	active?: boolean;

	stateRegistration?: string;
	cityRegistration?: string;
	cnae?: string;
	simple: boolean;
	cityCode?: string;

	status?: TUnitStatus;
}
