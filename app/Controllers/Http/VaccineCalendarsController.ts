import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import VaccineCalendarService from 'App/Services/VaccineCalendarService';
import UpdateVaccineCalendarValidator from 'App/Validators/VaccineCalendar/UpdateVaccineCalendarValidator';

@inject()
export default class VaccineCalendarsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: VaccineCalendarService,
  ) {}

  public async index({ request, response }: HttpContextContract) {
    const qs = request.qs();
    const result = await this.service.index({
      vaccineProtocol: qs.vaccineProtocol,
      vaccine: qs.vaccine,
      patient: qs.patient,
      schedule: qs.schedule,
      scheduleDate: qs.scheduleDate,
      applicationDate: qs.applicationDate,
    });

    return response.ok(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateVaccineCalendarValidator);

    const result = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      payload,
    );

    return response.ok(result);
  }

  public async destroy({ params, response }: HttpContextContract) {
    await this.service.destroy(params.id);

    return response.noContent();
  }
}
