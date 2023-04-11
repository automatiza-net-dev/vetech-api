import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import MedicalPrescriptionService, {
  MedicalPrescriptionValidation,
} from 'App/Services/MedicalPrescriptionService';
import SharedService from 'App/Services/SharedService';
import CreateMedicalPrescriptionValidator from 'App/Validators/MedicalPrescription/CreateMedicalPrescriptionValidator';
import UpdateMedicalPrescriptionValidator from 'App/Validators/MedicalPrescription/UpdateMedicalPrescriptionValidator';

@inject()
export default class MedicalPrescriptionsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: MedicalPrescriptionService,
  ) {}

  public async index({ auth, response }: HttpContextContract) {
    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
    );

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const result = await this.service.show(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateMedicalPrescriptionValidator);
    const { key } = this.service.matchSchema(payload.type, payload.frequency);

    const payload2 = await request.validate(MedicalPrescriptionValidation[key]);

    const result = await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
      payload2,
    );

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateMedicalPrescriptionValidator);
    const { key } = this.service.matchSchema(payload.type, payload.frequency);
    const payload2 = await request.validate(MedicalPrescriptionValidation[key]);

    const result = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      payload,
      payload2,
    );

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.delete(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }
}
