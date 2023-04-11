import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import AccountPlanGroupService from 'App/Services/AccountPlanGroupService';
import SharedService from 'App/Services/SharedService';
import CreateAccountPlanGroupValidator from 'App/Validators/AccountPlanGroup/CreateAccountPlanGroupValidator';
import UpdateAccountPlanGroupValidator from 'App/Validators/AccountPlanGroup/UpdateAccountPlanGroupValidator';

@inject()
export default class AccountPlanGroupsController {
  constructor(
    private sharedService: SharedService,
    private service: AccountPlanGroupService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const qs = request.qs();
    const data = await this.service.index(authCtx, {
      description: qs.description,
      type: qs.type,
    });

    return response.ok(data);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAccountPlanGroupValidator);
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
    const payload = await request.validate(UpdateAccountPlanGroupValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);

    const data = await this.service.update(authCtx, params.id, payload);

    return response.ok(data);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);
    await this.service.remove(authCtx, params.id);

    return response.noContent();
  }
}
