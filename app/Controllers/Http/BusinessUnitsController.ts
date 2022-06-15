import { inject } from '@adonisjs/fold';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BusinessUnitService from 'App/Services/BusinessUnitService';

@inject()
export default class BusinessUnitsController {
  constructor(private readonly service: BusinessUnitService) {}

  public async index({ response }: HttpContextContract) {
    return response.ok(await this.service.index());
  }
}
