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
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const data = await this.service.index(unit_id, {
      description: qs.description,
    });

    return response.ok(data);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateAccountPlanGroupValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const data = await this.service.store(unit_id, payload);

    return response.created(data);
  }

  public async show({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const data = await this.service.show(unit_id, request.param('id'));

    return response.ok(data);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateAccountPlanGroupValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const data = await this.service.update(unit_id, params.id, payload);

    return response.ok(data);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    await this.service.remove(unit_id, params.id);

    return response.noContent();
  }
}
