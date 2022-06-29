import { inject } from '@adonisjs/fold';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PatientService from 'App/Services/PatientService';
import CreatePatientWithTutorValidator from 'App/Validators/Patient/CreatePatientWithTutorValidator';

@inject()
export default class PatientTutorsController {
  constructor(private readonly service: PatientService) {}

  public async show({ auth, params, response }: HttpContextContract) {
    const patients = await this.service.show(
      auth.use('api').token!.meta.unit_id,
      params.id,
      true,
    );

    return response.ok(patients);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePatientWithTutorValidator);

    const patient = await this.service.storeTutor(
      auth.use('api').token!.meta.unit_id,
      payload,
    );

    return response.created(patient);
  }
}
