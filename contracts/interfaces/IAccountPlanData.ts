import { AccountPlanType } from "App/Models/AccountPlan";

export default interface IAccountPlanData {
	code?: string;
	description: string;
	type: AccountPlanType;
	active: boolean;
	accountPlanGroupId: number;
	parentId?: string;
	dre?: boolean;
}
