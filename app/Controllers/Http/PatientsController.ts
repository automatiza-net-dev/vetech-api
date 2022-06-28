import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PatientService from 'App/Services/PatientService';
import CreatePatientValidator from 'App/Validators/Patient/CreatePatientValidator';

@inject()
export default class PatientsController {
  constructor(private readonly service: PatientService) {}

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePatientValidator);

    const patient = await this.service.store(
      auth.use('api').token!.meta.unit_id,
      payload,
    );

    return response.created(patient);
  }
}
