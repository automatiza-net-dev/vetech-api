import { inject } from '@adonisjs/fold';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import EconomicGroupService from 'App/Services/EconomicGroupService';
import SharedService from 'App/Services/SharedService';
import UpdateEconomicGroupValidator from 'App/Validators/EconomicGroup/UpdateEconomicGroupValidator';

@inject()
export default class EconomicGroupsController {
  constructor(
    private readonly service: EconomicGroupService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ response }: HttpContextContract) {
    return response.ok(await this.service.index());
  }

  public async update({ params, request, response }: HttpContextContract) {
    const { id } = params;
    const payload = await request.validate(UpdateEconomicGroupValidator);
    const group = await this.service.update(id, payload);

    return response.ok(group);
  }

  public async users({ params, response }: HttpContextContract) {
    const { id } = params;
    const users = await this.service.getUsers(id);
    return response.ok(users);
  }

  public async userEconomicGroups({ auth, response }: HttpContextContract) {
    const { user } = this.sharedService.extractUser(auth);

    const groups = await this.service.userEconomicGroups(user);

    return response.ok(groups);
  }
}
