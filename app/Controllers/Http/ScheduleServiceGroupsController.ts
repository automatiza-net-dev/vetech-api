import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ScheduleServiceGroupService from 'App/Services/ScheduleServiceGroupService';
import CreateScheduleServiceGroupValidator from 'App/Validators/ScheduleServiceGroup/CreateScheduleServiceGroupValidator';

@inject()
export default class ScheduleServiceGroupsController {
  constructor(private readonly service: ScheduleServiceGroupService) {}

  public async index({ auth, response }: HttpContextContract) {
    const data = await this.service.index(
      auth.use('api').user!,
      auth.use('api').token!.meta.unit_id,
    );

    return response.ok(data);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateScheduleServiceGroupValidator);
    const data = await this.service.store(
      auth.use('api').user!,
      auth.use('api').token!.meta.unit_id,
      payload,
    );

    return response.created(data);
  }
}
