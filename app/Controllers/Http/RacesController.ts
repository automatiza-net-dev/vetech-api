import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import RaceService from 'App/Services/RaceService';
import CreateRaceValidator from 'App/Validators/Race/CreateRaceValidator';
import UpdateRaceValidator from 'App/Validators/Race/UpdateRaceValidator';

@inject()
export default class RacesController {
  constructor(private readonly service: RaceService) {}

  public async index({ auth, response }: HttpContextContract) {
    const result = await this.service.index(
      auth.use('api').token!.meta.unit_id,
    );

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const result = await this.service.show(
      auth.use('api').token!.meta.unit_id,
      params.id,
    );

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateRaceValidator);

    const result = await this.service.store(
      auth.use('api').token!.meta.unit_id,
      payload,
    );

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateRaceValidator);

    const result = await this.service.update(
      auth.use('api').token!.meta.unit_id,
      params.id,
      payload,
    );

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.destroy(auth.use('api').token!.meta.unit_id, params.id);

    return response.noContent();
  }
}
