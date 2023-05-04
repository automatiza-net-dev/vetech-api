import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ProfessionService from 'App/Services/ProfessionService';

@inject()
export default class ProfessionsController {
  constructor(private readonly service: ProfessionService) {}

  public async index({ request, response }: HttpContextContract) {
    const qs = request.qs();
    const result = await this.service.index({
      description: qs.description,
    });

    return response.ok(result);
  }

  public async show({ params, response }: HttpContextContract) {
    const result = await this.service.show(params.id);

    return response.ok(result);
  }
}
