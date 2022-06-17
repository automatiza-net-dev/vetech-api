import { inject } from '@adonisjs/fold';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BusinessUnitService from 'App/Services/BusinessUnitService';
import UserRoleService from 'App/Services/UserRoleService';
import UpdateBusinessUnitValidator from 'App/Validators/BusinessUnit/UpdateBusinessUnitValidator';

@inject()
export default class BusinessUnitsController {
  constructor(
    private readonly service: BusinessUnitService,
    private readonly userRoleService: UserRoleService,
  ) {}

  public async index({ response }: HttpContextContract) {
    return response.ok(await this.service.index());
  }

  public async update({ params, request, response }: HttpContextContract) {
    const { id } = params;
    const payload = await request.validate(UpdateBusinessUnitValidator);
    const updatedUnit = await this.service.update(id, payload);

    return response.ok(updatedUnit);
  }

  public async users({ params, response }: HttpContextContract) {
    const { id } = params;
    const users = await this.userRoleService.getUnitUsers(id);

    return response.ok(users);
  }
}
