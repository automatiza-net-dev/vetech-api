import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import RoleService from 'App/Services/RoleService';
import CreateRoleValidator from 'App/Validators/Role/CreateRoleValidator';
import UpdateRoleValidator from 'App/Validators/Role/UpdateRoleValidator';

@inject()
export default class RolesController {
  constructor(private readonly roleService: RoleService) {}

  public async index({ response }: HttpContextContract) {
    response.ok(await this.roleService.index());
  }

  public async show({ params, response }: HttpContextContract) {
    response.ok(await this.roleService.show(params.id));
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateRoleValidator);
    const newRole = await this.roleService.store(payload);

    return response.created(newRole);
  }

  public async update({ params, request, response }: HttpContextContract) {
    const { id } = params;
    const payload = await request.validate(UpdateRoleValidator);
    const updatedRole = await this.roleService.update(id, payload);

    return response.created(updatedRole);
  }
}
