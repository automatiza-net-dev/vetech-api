import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PlanService from 'App/Services/PlanService';
import SharedService from 'App/Services/SharedService';
import CreatePlanValidator from 'App/Validators/Plan/CreatePlanValidator';
import UpdatePlanValidator from 'App/Validators/Plan/UpdatePlanValidator';

@inject()
export default class PlansController {
  constructor(
    private sharedService: SharedService,
    private readonly planService: PlanService,
  ) {}

  public async index({ request, response, auth }: HttpContextContract) {
    const qs = request.qs();
    return response.ok(
      await this.planService.index(
        await this.sharedService.getAuthContext(auth),
        {
          description: qs.description,
        },
      ),
    );
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const data = await request.validate(CreatePlanValidator);
    const plan = await this.planService.store(
      await this.sharedService.getAuthContext(auth),
      data,
    );

    return response.created(plan);
  }

  public async show({ params, response, auth }: HttpContextContract) {
    const plan = await this.planService.show(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(plan);
  }

  public async update({
    params,
    request,
    response,
    auth,
  }: HttpContextContract) {
    const data = await request.validate(UpdatePlanValidator);
    const plan = await this.planService.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      data,
    );

    return response.ok(plan);
  }

  public async destroy({ params, response, auth }: HttpContextContract) {
    await this.planService.remove(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }
}
