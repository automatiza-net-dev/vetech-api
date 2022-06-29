import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SpecieService from 'App/Services/SpecieService';
import CreateSpecieValidator from 'App/Validators/Specie/CreateSpecieValidator';

@inject()
export default class SpeciesController {
  constructor(private readonly service: SpecieService) {}

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
    const payload = await request.validate(CreateSpecieValidator);

    const result = await this.service.store(
      auth.use('api').token!.meta.unit_id,
      payload,
    );

    return response.created(result);
  }
}
