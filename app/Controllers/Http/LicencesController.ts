import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import LicenceService from 'App/Services/LicenceService';
import SharedService from 'App/Services/SharedService';
import AdditionalTrialValidator from 'App/Validators/Licence/AdditionalTrialValidator';
import CreateLicenceValidator from 'App/Validators/Licence/CreateLicenceValidator';

@inject()
export default class LicencesController {
  constructor(
    private readonly service: LicenceService,
    private readonly sharedService: SharedService,
  ) {}

  public async additional({ request, response }: HttpContextContract) {
    const payload = await request.validate(AdditionalTrialValidator);

    await this.service.addAdditionalTrial(payload);

    return response.noContent();
  }

  public async custom({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateLicenceValidator);
    await this.service.custom(payload);

    return response.created();
  }
}
