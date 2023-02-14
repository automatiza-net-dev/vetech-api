import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import TreatmentService from 'App/Services/TreatmentService';
import OpenTreatmentValidator from 'App/Validators/Treatment/OpenTreatmentValidator';
import UpdateTreatmentValidator from 'App/Validators/Treatment/UpdateTreatmentValidator';

@inject()
export default class TreatmentsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: TreatmentService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, qs);

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async open({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(OpenTreatmentValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.open(unit_id, user, payload);

    return response.created();
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateTreatmentValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.update(unit_id, params.id, payload);

    return response.noContent();
  }

  public async close({ auth, params, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.close(unit_id, user, params.id);

    return response.noContent();
  }
}
