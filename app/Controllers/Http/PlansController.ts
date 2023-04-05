import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PlanService from 'App/Services/PlanService';
import CreatePlanValidator from 'App/Validators/Plan/CreatePlanValidator';
import UpdatePlanValidator from 'App/Validators/Plan/UpdatePlanValidator';

@inject()
export default class PlansController {
  constructor(private readonly planService: PlanService) {}

  public async index({ request, response }: HttpContextContract) {
    const qs = request.qs();
    return response.ok(
      await this.planService.index({
        description: qs.description,
      }),
    );
  }

  public async store({ request, response }: HttpContextContract) {
    const data = await request.validate(CreatePlanValidator);
    const plan = await this.planService.store(data);

    return response.created(plan);
  }

  public async show({ params, response }: HttpContextContract) {
    const plan = await this.planService.show(params.id);

    return response.ok(plan);
  }

  public async update({ params, request, response }: HttpContextContract) {
    const data = await request.validate(UpdatePlanValidator);
    const plan = await this.planService.update(params.id, data);

    return response.ok(plan);
  }

  public async destroy({ params, response }: HttpContextContract) {
    await this.planService.remove(params.id);

    return response.noContent();
  }
}
