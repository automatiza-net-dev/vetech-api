import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PlanService from 'App/Services/PlanService';
import CreatePlanValidator from 'App/Validators/Plan/CreatePlanValidator';

@inject()
export default class PlansController {
  constructor(private readonly planService: PlanService) {}

  public async store({ request, response }: HttpContextContract) {
    const data = await request.validate(CreatePlanValidator);
    const plan = await this.planService.store(data);

    return response.created(plan);
  }
}
