import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ScheduleStatusService from 'App/Services/ScheduleStatusService';
import SharedService from 'App/Services/SharedService';
import CreateScheduleStatusValidator from 'App/Validators/ScheduleStatus/CreateScheduleStatusValidator';
import UpdateScheduleStatusValidator from 'App/Validators/ScheduleStatus/UpdateScheduleStatusValidator';

@inject()
export default class ScheduleStatusesController {
  constructor(
    private readonly service: ScheduleStatusService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, user, {
      description: qs.description,
    });

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, user, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateScheduleStatusValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, user, payload);

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateScheduleStatusValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const result = await this.service.update(unit_id, user, params.id, payload);

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.destroy(unit_id, user, params.id);

    return response.noContent();
  }
}
