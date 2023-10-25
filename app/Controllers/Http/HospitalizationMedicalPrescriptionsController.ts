import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import HospitalizationMedicalPrescriptionService from 'App/Services/HospitalizationMedicalPrescriptionService';
import { MedicalPrescriptionValidation } from 'App/Services/MedicalPrescriptionService';
import SharedService from 'App/Services/SharedService';
import CreateHospitalizationMedicalPrescriptionValidator from 'App/Validators/HospitalizationMedicalPrescription/CreateHospitalizationMedicalPrescriptionValidator';
import UpdateHospitalizationMedicalPrescriptionScheduleValidator from 'App/Validators/HospitalizationMedicalPrescription/UpdateHospitalizationMedicalPrescriptionScheduleValidator';
import UpdateHospitalizationMedicalPrescriptionValidator from 'App/Validators/HospitalizationMedicalPrescription/UpdateHospitalizationMedicalPrescriptionValidator';

@inject()
export default class HospitalizationMedicalPrescriptionsController {
  constructor(
    private readonly service: HospitalizationMedicalPrescriptionService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.index(unit_id, request.qs());

    return response.ok(result);
  }

  public async schedulingIndex({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const qs = request.qs();

    const result = await this.service.schedulingIndex(unit_id, {
      hospitalization: qs.hospitalization,
      fromScheduledDate: qs.from,
      toScheduledDate: qs.to,
    });

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      CreateHospitalizationMedicalPrescriptionValidator,
    );
    const { key } = this.service.matchSchema(payload.type, payload.frequency);
    // @ts-expect-error its fine
    const payload2 = await request.validate(MedicalPrescriptionValidation[key]);

    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.store(payload, payload2, unit_id, user);
    await this.service.createScheduling(result, user);

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(
      UpdateHospitalizationMedicalPrescriptionValidator,
    );
    const { key } = this.service.matchSchema(payload.type, payload.frequency);
    // @ts-expect-error its fine
    const payload2 = await request.validate(MedicalPrescriptionValidation[key]);

    const authCtx = await this.sharedService.getAuthContext(auth);

    const result = await this.service.update(
      params.id,
      authCtx.user,
      payload,
      payload2,
    );

    return response.ok(result);
  }

  public async interruptPrescription({
    auth,
    params,
    response,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    await this.service.interruptPrescription(authCtx, params.id);

    return response.noContent();
  }

  public async excludePrescription({
    auth,
    params,
    response,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    await this.service.excludePrescription(authCtx, params.id);

    return response.noContent();
  }

  public async updateSchedule({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(
      UpdateHospitalizationMedicalPrescriptionScheduleValidator,
    );
    const { user } = this.sharedService.extractUser(auth);

    await this.service.updateScheduling(params.id, user, payload);

    return response.noContent();
  }

  public async destroy({ params, response }: HttpContextContract) {
    await this.service.delete(params.id);

    return response.noContent();
  }
}
