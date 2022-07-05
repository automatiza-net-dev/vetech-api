import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ScheduleStatusService from 'App/Services/ScheduleStatusService';
import CreateScheduleStatusValidator from 'App/Validators/ScheduleStatus/CreateScheduleStatusValidator';

@inject()
export default class ScheduleStatusesController {
  constructor(private readonly service: ScheduleStatusService) {}

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateScheduleStatusValidator);

    const result = await this.service.store(
      auth.use('api').token!.meta.unit_id,
      auth.use('api').user!,
      payload,
    );

    return response.created(result);
  }
}
