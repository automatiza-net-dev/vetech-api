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

  public async index({ auth, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const data = await this.service.index(user, unit_id);

    return response.ok(data);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const data = await this.service.show(user, unit_id, params.id);

    return response.ok(data);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateScheduleServiceTypeValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const data = await this.service.store(user, unit_id, payload);

    return response.created(data);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateScheduleServiceTypeValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    const data = await this.service.update(user, unit_id, params.id, payload);

    return response.created(data);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.destroy(user, unit_id, params.id);

    return response.noContent();
  }
}
