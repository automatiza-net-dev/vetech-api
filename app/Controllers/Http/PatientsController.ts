import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PatientService from 'App/Services/PatientService';
import CreatePatientValidator from 'App/Validators/Patient/CreatePatientValidator';
import UpdatePatientValidator from 'App/Validators/Patient/UpdatePatientValidator';

@inject()
export default class PatientsController {
  constructor(private readonly service: PatientService) {}

  public async index({ auth, response }: HttpContextContract) {
    const patients = await this.service.index(
      auth.use('api').token!.meta.unit_id,
    );

    return response.ok(patients);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const patients = await this.service.show(
      auth.use('api').token!.meta.unit_id,
      params.id,
    );

    return response.ok(patients);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePatientValidator);

    const patient = await this.service.store(
      auth.use('api').token!.meta.unit_id,
      payload,
    );

    return response.created(patient);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdatePatientValidator);

    const patient = await this.service.update(
      auth.use('api').token!.meta.unit_id,
      params.id,
      payload,
    );

    return response.ok(patient);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.destroy(auth.use('api').token!.meta.unit_id, params.id);

    return response.noContent();
  }
}
