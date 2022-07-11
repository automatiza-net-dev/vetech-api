import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ScheduleServiceGroupService from 'App/Services/ScheduleServiceGroupService';
import SharedService from 'App/Services/SharedService';
import CreateScheduleServiceGroupValidator from 'App/Validators/ScheduleServiceGroup/CreateScheduleServiceGroupValidator';
import UpdateScheduleServiceGroupValidator from 'App/Validators/ScheduleServiceGroup/UpdateScheduleServiceGroupValidator';

@inject()
export default class ScheduleServiceGroupsController {
  constructor(
    private readonly service: ScheduleServiceGroupService,
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
    const payload = await request.validate(CreateScheduleServiceGroupValidator);
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
    const payload = await request.validate(UpdateScheduleServiceGroupValidator);
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
