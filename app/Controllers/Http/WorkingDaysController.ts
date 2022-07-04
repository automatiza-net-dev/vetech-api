import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import WorkingDayService from 'App/Services/WorkingDayService';
import CreateWorkingDayValidator from 'App/Validators/WorkingDay/CreateWorkingDayValidator';

@inject()
export default class WorkingDaysController {
  constructor(private readonly service: WorkingDayService) {}

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateWorkingDayValidator);
    const data = await this.service.store(
      auth.use('api').token!.meta.unit_id,
      payload,
    );

    return response.created(data);
  }
}
