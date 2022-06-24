import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BusinessUnit from 'App/Models/BusinessUnit';
import LicenceService from 'App/Services/LicenceService';
import CreateLicenceValidator from 'App/Validators/Licence/CreateLicenceValidator';

@inject()
export default class LicencesController {
  constructor(private readonly service: LicenceService) {}

  public async additional({ auth, response }: HttpContextContract) {
    const unit = await BusinessUnit.find(auth.use('api').token!.meta.unit_id);

    await this.service.addAdditionalTrial(unit!);

    return response.noContent();
  }

  public async custom({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateLicenceValidator);
    await this.service.custom(payload);

    return response.created();
  }
}
