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
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.index(unit_id);

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateMedicalPrescriptionValidator);
    const { key } = this.service.matchSchema(payload.type, payload.frequency);
    const payload2 = await request.validate(MedicalPrescriptionValidation[key]);

    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, payload, payload2);

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

    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.update(
      unit_id,
      params.id,
      payload,
      payload2,
    );

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.delete(unit_id, params.id);

    return response.noContent();
  }
}
