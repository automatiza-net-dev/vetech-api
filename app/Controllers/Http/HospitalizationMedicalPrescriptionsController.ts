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

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      CreateHospitalizationMedicalPrescriptionValidator,
    );
    const { key } = this.service.matchSchema(payload.type, payload.frequency);
    const payload2 = await request.validate(MedicalPrescriptionValidation[key]);

    const { user } = this.sharedService.extractUser(auth);

    const result = await this.service.store(payload, payload2);
    await this.service.createScheduling(result, user);

    return response.created(result);
  }

  public async update({ params, request, response }: HttpContextContract) {
    const payload = await request.validate(
      UpdateHospitalizationMedicalPrescriptionValidator,
    );
    const { key } = this.service.matchSchema(payload.type, payload.frequency);
    const payload2 = await request.validate(MedicalPrescriptionValidation[key]);

    const result = await this.service.update(params.id, payload, payload2);

    return response.ok(result);
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
