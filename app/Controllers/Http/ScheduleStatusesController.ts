import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ScheduleStatusService from 'App/Services/ScheduleStatusService';
import CreateScheduleStatusValidator from 'App/Validators/ScheduleStatus/CreateScheduleStatusValidator';
import UpdateScheduleStatusValidator from 'App/Validators/ScheduleStatus/UpdateScheduleStatusValidator';

@inject()
export default class ScheduleStatusesController {
  constructor(private readonly service: ScheduleStatusService) {}

  public async index({ auth, response }: HttpContextContract) {
    const result = await this.service.index(
      auth.use('api').token!.meta.unit_id,
      auth.use('api').user!,
    );

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const result = await this.service.show(
      auth.use('api').token!.meta.unit_id,
      auth.use('api').user!,
      params.id,
    );

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateScheduleStatusValidator);

    const result = await this.service.store(
      auth.use('api').token!.meta.unit_id,
      auth.use('api').user!,
      payload,
    );

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateScheduleStatusValidator);

    const result = await this.service.update(
      auth.use('api').token!.meta.unit_id,
      auth.use('api').user!,
      params.id,
      payload,
    );

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.destroy(
      auth.use('api').token!.meta.unit_id,
      auth.use('api').user!,
      params.id,
    );

    return response.noContent();
  }
}
