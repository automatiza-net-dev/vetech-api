import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import HospitalizationMedicalPrescriptionService from 'App/Services/HospitalizationMedicalPrescriptionService';
import { MedicalPrescriptionValidation } from 'App/Services/MedicalPrescriptionService';
import CreateHospitalizationMedicalPrescriptionValidator from 'App/Validators/HospitalizationMedicalPrescription/CreateHospitalizationMedicalPrescriptionValidator';
import UpdateHospitalizationMedicalPrescriptionValidator from 'App/Validators/HospitalizationMedicalPrescription/UpdateHospitalizationMedicalPrescriptionValidator';

@inject()
export default class HospitalizationMedicalPrescriptionsController {
  constructor(
    private readonly service: HospitalizationMedicalPrescriptionService,
  ) {}

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(
      CreateHospitalizationMedicalPrescriptionValidator,
    );
    const { key } = this.service.matchSchema(payload.type, payload.frequency);
    const payload2 = await request.validate(MedicalPrescriptionValidation[key]);

    const result = await this.service.store(payload, payload2);

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

  public async destroy({ params, response }: HttpContextContract) {
    await this.service.delete(params.id);

    return response.noContent();
  }
}
