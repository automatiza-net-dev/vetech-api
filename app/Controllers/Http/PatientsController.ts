import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PatientService from 'App/Services/PatientService';
import SharedService from 'App/Services/SharedService';
import CreatePatientValidator from 'App/Validators/Patient/CreatePatientValidator';
import UpdatePatientValidator from 'App/Validators/Patient/UpdatePatientValidator';
import ISearchPatient from 'Contracts/interfaces/ISearchPatient';

@inject()
export default class PatientsController {
  constructor(
    private readonly service: PatientService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const qs = request.qs();
    const patients = await this.service.index(unit_id, {
      name: qs.name,
      gender: qs.gender,
      type: qs.type,
    });

    return response.ok(patients);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const patients = await this.service.show(unit_id, params.id);

    return response.ok(patients);
  }

  public async search({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const qs = request.qs();

    const data = {
      tutor: qs.tutor,
      patient: qs.patient,
    } as ISearchPatient;

    const patients = await this.service.search(unit_id, data);

    return response.ok(patients);
  }

  public async showAnimals({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const patients = await this.service.animalsIndex(unit_id, {
      name: qs.name,
      race: qs.race,
      specie: qs.specie,
      tutor: qs.tutor,
      document: qs.document,
      phone: qs.phone,
    });

    return response.ok(patients);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePatientValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const patient = await this.service.store(unit_id, payload);

    return response.created(patient);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdatePatientValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const patient = await this.service.update(unit_id, params.id, payload);

    return response.ok(patient);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }

  public async setMainTutor({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    await this.service.setMainTutor(unit_id, params.patient, params.tutor);

    return response.noContent();
  }
}
