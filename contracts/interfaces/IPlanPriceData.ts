import { PlanPriceRecurrence } from 'App/Models/PlanPrice';

export default interface IPlanPriceData {
  plan_id: string;
  planPrice: number;
  recurrence: PlanPriceRecurrence;
  expirationDays: number;
}
