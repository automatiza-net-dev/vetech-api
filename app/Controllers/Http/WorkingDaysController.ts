import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import WorkingDayService from 'App/Services/WorkingDayService';
import CreateWorkingDayValidator from 'App/Validators/WorkingDay/CreateWorkingDayValidator';
import UpdateWorkingDayValidator from 'App/Validators/WorkingDay/UpdateWorkingDayValidator';

@inject()
export default class WorkingDaysController {
  constructor(private readonly service: WorkingDayService) {}

  public async index({ auth, response }: HttpContextContract) {
    const data = await this.service.index(auth.use('api').token!.meta.unit_id);

    return response.ok(data);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const data = await this.service.show(
      auth.use('api').token!.meta.unit_id,
      params.id,
    );

    return response.ok(data);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateWorkingDayValidator);
    const data = await this.service.store(
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
    const payload = await request.validate(UpdateWorkingDayValidator);
    const data = await this.service.update(
      auth.use('api').token!.meta.unit_id,
      params.id,
      payload,
    );

    return response.ok(data);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.destroy(auth.use('api').token!.meta.unit_id, params.id);

    return response.noContent();
  }
}
