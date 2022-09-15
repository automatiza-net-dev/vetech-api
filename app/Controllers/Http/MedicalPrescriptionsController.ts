import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import MedicalPrescriptionService from 'App/Services/MedicalPrescriptionService';
import SharedService from 'App/Services/SharedService';
import CreateMedicalPrescriptionValidator from 'App/Validators/MedicalPrescription/CreateMedicalPrescriptionValidator';

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
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, payload, request.body());

    return response.created(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.delete(unit_id, params.id);

    return response.noContent();
  }
}
