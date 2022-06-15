import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PermissionService from 'App/Services/PermissionService';

@inject()
export default class PermissionsController {
  constructor(private readonly service: PermissionService) {}

  public async index({ response }: HttpContextContract) {
    return response.ok(await this.service.index());
  }
}
