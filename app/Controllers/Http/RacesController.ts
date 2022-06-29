import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import RaceService from 'App/Services/RaceService';
import CreateRaceValidator from 'App/Validators/Race/CreateRaceValidator';

@inject()
export default class RacesController {
  constructor(private readonly service: RaceService) {}

  public async index({ auth, response }: HttpContextContract) {
    const result = await this.service.index(
      auth.use('api').token!.meta.unit_id,
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
}
