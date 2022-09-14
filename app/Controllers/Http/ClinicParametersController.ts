import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ClinicParameterService from 'App/Services/ClinicParameterService';
import CreateClinicParameterValidator from 'App/Validators/ClinicParameter/CreateClinicParameterValidator';
import UpdateClinicParameterValidator from 'App/Validators/ClinicParameter/UpdateClinicParameterValidator';

@inject()
export default class ClinicParametersController {
  constructor(private service: ClinicParameterService) {}

  public async index({ response }: HttpContextContract) {
    const beds = await this.service.index();

    return response.ok(beds);
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateClinicParameterValidator);

    const bed = await this.service.store(payload);

    return response.created(bed);
  }

  public async show({ params, response }: HttpContextContract) {
    const bed = await this.service.show(params.id);

    return response.json(bed);
  }

  public async update({ params, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateClinicParameterValidator);

    const bed = await this.service.update(params.id, payload);

    return response.json(bed);
  }

  public async destroy({ params, response }: HttpContextContract) {
    await this.service.destroy(params.id);

    return response.noContent();
  }
}
