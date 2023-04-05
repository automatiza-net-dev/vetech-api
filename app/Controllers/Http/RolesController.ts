import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import RoleService from 'App/Services/RoleService';
import AddPermissionValidator from 'App/Validators/Role/AddPermissionValidator';
import CreateRoleValidator from 'App/Validators/Role/CreateRoleValidator';
import UpdateRoleValidator from 'App/Validators/Role/UpdateRoleValidator';

@inject()
export default class RolesController {
  constructor(private readonly roleService: RoleService) {}

  public async index({ request, response }: HttpContextContract) {
    const qs = request.qs();

    response.ok(
      await this.roleService.index({
        name: qs.name,
      }),
    );
  }

  public async show({ params, response }: HttpContextContract) {
    response.ok(await this.roleService.show(params.id));
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateRoleValidator);
    const newRole = await this.roleService.store(payload);

    return response.created(newRole);
  }

  public async addPermission({ request, response }: HttpContextContract) {
    const payload = await request.validate(AddPermissionValidator);
    await this.roleService.addPermission(payload);

    return response.created();
  }

  public async update({ params, request, response }: HttpContextContract) {
    const { id } = params;
    const payload = await request.validate(UpdateRoleValidator);
    const updatedRole = await this.roleService.update(id, payload);

    return response.created(updatedRole);
  }

  public async destroy({ params, response }: HttpContextContract) {
    const { id } = params;
    await this.roleService.delete(id);

    return response.noContent();
  }

  public async deletePermission({ params, response }: HttpContextContract) {
    const { id, permission } = params;
    await this.roleService.deletePermission(id, permission);

    return response.noContent();
  }
}
