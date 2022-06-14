import { inject } from '@adonisjs/fold';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import EconomicGroupService from 'App/Services/EconomicGroupService';

@inject()
export default class EconomicGroupsController {
  constructor(private readonly service: EconomicGroupService) {}

  public async index({ response }: HttpContextContract) {
    return response.ok(await this.service.index());
  }
}
