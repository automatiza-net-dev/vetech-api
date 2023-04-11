import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ClinicParameterService from 'App/Services/ClinicParameterService';
import SharedService from 'App/Services/SharedService';
import CreateClinicParameterValidator from 'App/Validators/ClinicParameter/CreateClinicParameterValidator';
import UpdateClinicParameterValidator from 'App/Validators/ClinicParameter/UpdateClinicParameterValidator';

@inject()
export default class ClinicParametersController {
  constructor(
    private sharedService: SharedService,
    private service: ClinicParameterService,
  ) {}

  public async index({ auth, response }: HttpContextContract) {
    const beds = await this.service.index(
      await this.sharedService.getAuthContext(auth),
    );

    return response.ok(beds);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateClinicParameterValidator);

    const bed = await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created(bed);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const bed = await this.service.show(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.json(bed);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateClinicParameterValidator);

    const bed = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      payload,
    );

    return response.json(bed);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.destroy(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }
}
