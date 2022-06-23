import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PlanPriceService from 'App/Services/PlanPriceService';
import CreatePlanPriceValidator from 'App/Validators/PlanPrice/CreatePlanPriceValidator';

@inject()
export default class PlanPricesController {
  constructor(private readonly service: PlanPriceService) {}

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePlanPriceValidator);
    const price = await this.service.store(payload);

    return response.created(price);
  }
}
