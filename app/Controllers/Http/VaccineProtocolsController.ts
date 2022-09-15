import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import VaccineProtocolService from 'App/Services/VaccineProtocolService';
import CreateVaccineProtocolValidator from 'App/Validators/VaccineProtocol/CreateVaccineProtocolValidator';
import UpdateVaccineProtocolValidator from 'App/Validators/VaccineProtocol/UpdateVaccineProtocolValidator';

@inject()
export default class VaccineProtocolsController {
  constructor(private readonly service: VaccineProtocolService) {}

  public async index({ request, response }: HttpContextContract) {
    const qs = request.qs();
    const result = await this.service.index({
      type: qs.type,
      vaccine: qs.vaccine,
    });

    return response.ok(result);
  }

  public async store({ request, response }: HttpContextContract) {
    const payload = await request.validate(CreateVaccineProtocolValidator);

    const result = await this.service.store(payload);

    return response.created(result);
  }

  public async update({ params, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateVaccineProtocolValidator);

    const result = await this.service.update(params.id, payload);

    return response.ok(result);
  }
}
