import { AccountPlanGroupType } from 'App/Models/AccountPlanGroup';

export default interface IAccountPlanGroupData {
  description: string;
  type: AccountPlanGroupType;
  active: boolean;
}
