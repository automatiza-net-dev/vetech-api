import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import CrmStatusService from 'App/Services/CrmStatusService';
import CreateCrmStatusValidator from 'App/Validators/CrmStatus/CreateCrmStatusValidator';
import UpdateCrmStatusValidator from 'App/Validators/CrmStatus/UpdateCrmStatusValidator';

@inject()
export default class CrmStatusesController {
  constructor(private service: CrmStatusService) {}

  async index({ request, response }: HttpContextContract) {
    const qs = request.qs();

    const result = await this.service.index({
      description: qs.description,
    });

    return response.ok(result);
  }

  async show({ params, response }: HttpContextContract) {
    const result = await this.service.show(params.id);

    return response.ok(result);
  }

  async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateCrmStatusValidator);

    await this.service.store(payload);

    return response.created();
  }

  async update({ params, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateCrmStatusValidator);

    await this.service.update(params.id, payload);

    return response.noContent();
  }

  async destroy({ params, response }: HttpContextContract) {
    await this.service.destroy(params.id);

    return response.noContent();
  }
}
