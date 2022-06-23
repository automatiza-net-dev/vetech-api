import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PlanPriceService from 'App/Services/PlanPriceService';
import CreatePlanPriceValidator from 'App/Validators/PlanPrice/CreatePlanPriceValidator';
import UpdatePlanPriceValidator from 'App/Validators/PlanPrice/UpdatePlanPriceValidator';

@inject()
export default class PlanPricesController {
  constructor(private readonly service: PlanPriceService) {}

  public async index({ response }: HttpContextContract) {
    return response.ok(await this.service.index());
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePlanPriceValidator);
    const price = await this.service.store(payload);

    return response.created(price);
  }

  public async show({ params, response }: HttpContextContract) {
    const price = await this.service.show(params.id);

    return response.ok(price);
  }

  public async update({ params, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdatePlanPriceValidator);
    const price = await this.service.update(params.id, payload);

    return response.ok(price);
  }
}
