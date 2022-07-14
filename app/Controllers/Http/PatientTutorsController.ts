import { inject } from '@adonisjs/fold';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PatientService from 'App/Services/PatientService';
import SharedService from 'App/Services/SharedService';
import CreatePatientWithTutorValidator from 'App/Validators/Patient/CreatePatientWithTutorValidator';
import UpdatePatientWithTutorValidator from 'App/Validators/Patient/UpdatePatientWithTutorValidator';

@inject()
export default class PatientTutorsController {
  constructor(
    private readonly service: PatientService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, response }: HttpContextContract) {
    const patients = await this.service.tutorsIndex(
      auth.use('api').token!.meta.unit_id,
    );

    return response.ok(patients);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const patients = await this.service.show(unit_id, params.id, true);

    return response.ok(patients);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePatientWithTutorValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const patient = await this.service.storeTutor(unit_id, payload);

    return response.created(patient);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdatePatientWithTutorValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const patient = await this.service.updateTutor(unit_id, params.id, payload);

    return response.ok(patient);
  }
}
