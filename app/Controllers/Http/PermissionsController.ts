import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PermissionService from 'App/Services/PermissionService';
import CreatePermissionValidator from 'App/Validators/Permission/CreatePermissionValidator';

@inject()
export default class PermissionsController {
  constructor(private readonly service: PermissionService) {}

  public async index({ response }: HttpContextContract) {
    return response.ok(await this.service.index());
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePermissionValidator);
    const newPermission = await this.service.store(payload);

    return response.created(newPermission);
  }

  public async show({ params, response }: HttpContextContract) {
    const { id } = params;
    return response.ok(await this.service.show(id));
  }

  public async destroy({ params, response }: HttpContextContract) {
    const { id } = params;
    await this.service.delete(id);
    return response.noContent();
  }
}
