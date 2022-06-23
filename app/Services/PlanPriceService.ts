import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import PlanPrice from 'App/Models/PlanPrice';
import PlanService from 'App/Services/PlanService';
import IPlanPriceData from 'Contracts/interfaces/IPlanPriceData';
import { v4 } from 'uuid';

@inject()
export default class PlanPriceService {
  constructor(private readonly planService: PlanService) {}

  public async index(): Promise<Array<PlanPrice>> {
    return PlanPrice.all();
  }

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

  public async show(id: string): Promise<PlanPrice> {
    const plan = await PlanPrice.find(id);

    if (!plan) {
      throw new ResourceNotFoundException(
        'Preço não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return plan;
  }
}
