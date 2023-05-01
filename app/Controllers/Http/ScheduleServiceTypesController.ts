import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ScheduleServiceTypeService from 'App/Services/ScheduleServiceTypeService';
import SharedService from 'App/Services/SharedService';
import CreateScheduleServiceTypeValidator from 'App/Validators/ScheduleServiceType/CreateScheduleServiceTypeValidator';
import UpdateScheduleServiceTypeValidator from 'App/Validators/ScheduleServiceType/UpdateScheduleServiceTypeValidator';

@inject()
export default class ScheduleServiceTypesController {
  constructor(
    private readonly service: ScheduleServiceTypeService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const qs = request.qs();
    const data = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      {
        description: qs.description,
        group: qs.group,
      },
    );

    return response.ok(data);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const data = await this.service.show(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(data);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateScheduleServiceTypeValidator);

    const data = await this.service.store(
      await this.sharedService.getAuthContext(auth),
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
    const payload = await request.validate(UpdateScheduleServiceTypeValidator);

    const data = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      payload,
    );

    return response.created(data);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.destroy(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }
}
