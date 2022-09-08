import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PatientVaccineService from 'App/Services/PatientVaccineService';
import SharedService from 'App/Services/SharedService';
import CreatePatientVaccineValidator from 'App/Validators/PatientVaccine/CreatePatientVaccineValidator';
import UpdatePatientVaccineValidator from 'App/Validators/PatientVaccine/UpdatePatientVaccineValidator';

@inject()
export default class PatientVaccinesController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: PatientVaccineService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, {
      vaccine: qs.vaccine,
      protocol: qs.protocol,
      patient: qs.patient,
    });

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePatientVaccineValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, user, payload);

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdatePatientVaccineValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.update(unit_id, params.id, user, payload);

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }
}
