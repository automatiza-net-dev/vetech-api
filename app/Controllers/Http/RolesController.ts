import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import RoleService from 'App/Services/RoleService';

@inject()
export default class RolesController {
  constructor(private readonly roleService: RoleService) {}

  public async index({ response }: HttpContextContract) {
    response.ok(await this.roleService.index());
  }
}
