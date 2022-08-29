import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ScheduleService from 'App/Services/ScheduleService';
import SharedService from 'App/Services/SharedService';
import CreateScheduleValidator from 'App/Validators/Schedule/CreateScheduleValidator';
import UpdateScheduleSpecificStatusValidator from 'App/Validators/Schedule/UpdateScheduleSpecificStatusValidator';
import UpdateScheduleValidator from 'App/Validators/Schedule/UpdateScheduleValidator';
import { addDays } from 'date-fns';

@inject()
export default class SchedulesController {
  constructor(
    private readonly service: ScheduleService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, {
      patient: qs.patient,
      complaint: qs.complaint,
    });

    return response.ok(result);
  }

  public async withSchedule({ auth, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.usersWithSchedule(unit_id);

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateScheduleValidator);
    const { user, unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, user, payload);

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateScheduleValidator);
    const { user, unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.update(unit_id, user, params.id, payload);

    return response.ok(result);
  }

  public async updateStatus({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      UpdateScheduleSpecificStatusValidator,
    );
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.updateScheduleStatusWithStaticValues(
      unit_id,
      payload,
    );

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }

  public async viewDisponibility({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.searchDisponibility({
      start: qs.start ?? new Date().toISOString(),
      end: qs.end ?? new Date().toISOString(),
      business: qs.business ?? unit_id,
      user: qs.user,
    });

    return response.ok(result);
  }

  public async viewServiceGroups({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const qs = request.qs();
    const result = await this.service.searchServices(unit_id, {
      start: qs.start ?? new Date().toISOString(),
      end: qs.end ?? new Date().toISOString(),
    });

    return response.ok(result);
  }

  public async userDailySchedule({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();

    const result = await this.service.userDailySchedule(
      unit_id,
      qs.id,
      new Date(qs.date),
    );

    return response.ok(result);
  }

  public async userAppointments({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();

    const result = await this.service.userAppointments(
      unit_id,
      params.id,
      addDays(new Date(qs.date), 1),
    );

    return response.ok(result);
  }
}
