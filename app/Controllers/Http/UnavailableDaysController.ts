import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import UnavailableDayService from 'App/Services/UnavailableDayService';
import CreateUnavailableDayValidator from 'App/Validators/UnavailableDay/CreateUnavailableDayValidator';
import UpdateUnavailableDayValidator from 'App/Validators/UnavailableDay/UpdateUnavailableDayValidator';

@inject()
export default class UnavailableDaysController {
  constructor(
    private readonly service: UnavailableDayService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const data = await this.service.index(unit_id, {
      user: qs.user,
      frequency: qs.frequency,
    });

    return response.ok(data);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const data = await this.service.show(unit_id, params.id);

    return response.ok(data);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateUnavailableDayValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const data = await this.service.store(unit_id, payload);

    return response.created(data);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateUnavailableDayValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const data = await this.service.update(unit_id, params.id, payload);

    return response.ok(data);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }
}
