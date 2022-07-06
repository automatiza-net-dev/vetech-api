import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ScheduleService from 'App/Services/ScheduleService';
import SharedService from 'App/Services/SharedService';
import CreateScheduleValidator from 'App/Validators/Schedule/CreateScheduleValidator';

@inject()
export default class SchedulesController {
  constructor(
    private readonly service: ScheduleService,
    private readonly sharedService: SharedService,
  ) {}

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateScheduleValidator);
    const { user, unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, user, payload);

    return response.created(result);
  }
}
