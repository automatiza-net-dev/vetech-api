import { AccountPlanGroupType } from "App/Models/AccountPlanGroup";

export default interface IAccountPlanGroupData {
	dreGroupId?: number;

	description: string;
	type: AccountPlanGroupType;
	active: boolean;
}
