import { inject } from '@adonisjs/fold';
import PlanPrice from 'App/Models/PlanPrice';
import PlanService from 'App/Services/PlanService';
import IPlanPriceData from 'Contracts/interfaces/IPlanPriceData';
import { v4 } from 'uuid';

@inject()
export default class PlanPriceService {
  constructor(private readonly planService: PlanService) {}

  public async store(data: IPlanPriceData): Promise<PlanPrice> {
    const plan = await this.planService.show(data.plan_id);
    return plan.related('planPrices').create({
      id: v4(),
      planPrice: data.planPrice,
      recurrence: data.recurrence,
      expirationDays: data.expirationDays,
      plan_id: data.plan_id,
    });
  }
}
