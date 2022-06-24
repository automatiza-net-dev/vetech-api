import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BusinessUnit from 'App/Models/BusinessUnit';
import LicenceService from 'App/Services/LicenceService';

@inject()
export default class LicencesController {
  constructor(private readonly service: LicenceService) {}

  public async additional({ auth, response }: HttpContextContract) {
    const unit = await BusinessUnit.find(auth.use('api').token!.meta.unit_id);

    await this.service.addAdditionalTrial(unit!);

    return response.noContent();
  }
}
