import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import AccountPlanService from 'App/Services/AccountPlanService';
import SharedService from 'App/Services/SharedService';
import CreateAccountPlanValidator from 'App/Validators/AccountPlan/CreateAccountPlanValidator';
import UpdateAccountPlanValidator from 'App/Validators/AccountPlan/UpdateAccountPlanValidator';

@inject()
export default class AccountPlansController {
  constructor(
    private sharedService: SharedService,
    private service: AccountPlanService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);
    const qs = request.qs();

    const data = await this.service.index(authCtx, {
      description: qs.description,
      code: qs.code,
      type: qs.type,
      group: qs.group,
      parent: qs.parent,
      unit: qs.unit,
    });

    return response.ok(data);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAccountPlanValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);
    const data = await this.service.store(authCtx, payload);

    return response.created(data);
  }

  public async show({ auth, request, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);
    const data = await this.service.show(authCtx, request.param('id'));

    return response.ok(data);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateAccountPlanValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);
    const data = await this.service.update(authCtx, params.id, payload);

    return response.ok(data);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);
    await this.service.destroy(authCtx, params.id);

    return response.noContent();
  }
}
