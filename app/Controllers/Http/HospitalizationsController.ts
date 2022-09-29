import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import HospitalizationService from 'App/Services/HospitalizationService';
import SharedService from 'App/Services/SharedService';
import CreateHospitalizationValidator from 'App/Validators/Hospitalization/CreateHospitalizationValidator';
import UpdateHospitalizationValidator from 'App/Validators/Hospitalization/UpdateHospitalizationValidator';

@inject()
export default class HospitalizationsController {
  constructor(
    private readonly service: HospitalizationService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const entity = await this.service.index(unit_id, {
      bed: qs.bed,
      patient: qs.patient,
      tutor: qs.tutor,
    });

    return response.ok(entity);
  }

  public async showTimeline({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const timeline = await this.service.timeline(unit_id, params.id);

    return response.ok(timeline);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateHospitalizationValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const entity = await this.service.store(unit_id, user, payload);

    return response.created(entity);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const invite = await this.service.show(unit_id, params.id);

    return response.ok(invite);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateHospitalizationValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const entity = await this.service.update(unit_id, params.id, user, payload);

    return response.ok(entity);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }
}
