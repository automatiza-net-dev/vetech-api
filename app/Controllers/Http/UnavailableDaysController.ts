import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import UnavailableDayService from 'App/Services/UnavailableDayService';
import CreateUnavailableDayValidator from 'App/Validators/UnavailableDay/CreateUnavailableDayValidator';
import UpdateUnavailableDayValidator from 'App/Validators/UnavailableDay/UpdateUnavailableDayValidator';

@inject()
export default class UnavailableDaysController {
  constructor(private readonly service: UnavailableDayService) {}

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
    const payload = await request.validate(CreateUnavailableDayValidator);
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
    const payload = await request.validate(UpdateUnavailableDayValidator);
    const data = await this.service.update(
      auth.use('api').token!.meta.unit_id,
      params.id,
      payload,
    );

    return response.ok(data);
  }
}
