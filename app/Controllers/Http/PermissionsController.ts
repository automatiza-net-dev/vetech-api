import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PermissionService from 'App/Services/PermissionService';

@inject()
export default class PermissionsController {
  constructor(private readonly service: PermissionService) {}

  public async index({ response }: HttpContextContract) {
    return response.ok(await this.service.index());
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
