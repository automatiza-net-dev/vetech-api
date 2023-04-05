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
    const { unit_id } = this.sharedService.extractUser(auth);
    const beds = await this.service.index(unit_id);

    return response.ok(beds);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateClinicParameterValidator);

    const { unit_id } = this.sharedService.extractUser(auth);

    const bed = await this.service.store(unit_id, payload);

    return response.created(bed);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const bed = await this.service.show(unit_id, params.id);

    return response.json(bed);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateClinicParameterValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const bed = await this.service.update(unit_id, params.id, payload);

    return response.json(bed);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }
}
