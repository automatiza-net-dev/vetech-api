import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import PatientExamService from 'App/Services/PatientExamService';
import SharedService from 'App/Services/SharedService';
import CreatePatientExamAttachmentValidator from 'App/Validators/PatientExam/CreatePatientExamAttachmentValidator';
import CreatePatientExamValidator from 'App/Validators/PatientExam/CreatePatientExamValidator';
import UpdatePatientExamValidator from 'App/Validators/PatientExam/UpdatePatientExamValidator';

@inject()
export default class PatientExamsController {
  constructor(
    private readonly service: PatientExamService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const exams = await this.service.index(unit_id, {
      patient: qs.patient,
      exam: qs.exam,
    });

    return response.ok(exams);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const exam = await this.service.show(unit_id, params.id);

    return response.ok(exam);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreatePatientExamValidator);

    const patient = await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created(patient);
  }

  public async storeAttachment({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(
      CreatePatientExamAttachmentValidator,
    );

    const patient = await this.service.createAttachment(
      await this.sharedService.getAuthContext(auth),
      params.id,
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
    const payload = await request.validate(UpdatePatientExamValidator);

    const patient = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      payload,
    );

    return response.ok(patient);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }

  public async destroyAttachment({
    auth,
    params,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    await this.service.deleteAttachment(unit_id, params.id, params.attachment);

    return response.noContent();
  }
}
