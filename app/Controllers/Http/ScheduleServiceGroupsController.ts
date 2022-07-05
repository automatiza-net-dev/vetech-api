import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ScheduleServiceGroupService from 'App/Services/ScheduleServiceGroupService';
import CreateScheduleServiceGroupValidator from 'App/Validators/ScheduleServiceGroup/CreateScheduleServiceGroupValidator';
import UpdateScheduleServiceGroupValidator from 'App/Validators/ScheduleServiceGroup/UpdateScheduleServiceGroupValidator';

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

  public async show({ auth, params, response }: HttpContextContract) {
    const data = await this.service.show(
      auth.use('api').user!,
      auth.use('api').token!.meta.unit_id,
      params.id,
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

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateScheduleServiceGroupValidator);
    const data = await this.service.update(
      auth.use('api').user!,
      auth.use('api').token!.meta.unit_id,
      params.id,
      payload,
    );

    return response.created(data);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.destroy(
      auth.use('api').user!,
      auth.use('api').token!.meta.unit_id,
      params.id,
    );

    return response.noContent();
  }
}
