import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import AttendanceService from 'App/Services/AttendanceService';
import SharedService from 'App/Services/SharedService';
import OpenAttendanceValidator from 'App/Validators/Attendances/OpenAttendanceValidator';
import UpdateAttendanceValidator from 'App/Validators/Attendances/UpdateAttendanceValidator';

@inject()
export default class AttendancesController {
  constructor(
    protected readonly sharedService: SharedService,
    protected readonly service: AttendanceService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, qs);

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async open({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(OpenAttendanceValidator);
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.open(unit_id, user, payload);

    return response.created();
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateAttendanceValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.update(unit_id, params.id, payload);

    return response.noContent();
  }

  public async close({ auth, params, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);

    await this.service.close(unit_id, user, params.id);

    return response.noContent();
  }
}
