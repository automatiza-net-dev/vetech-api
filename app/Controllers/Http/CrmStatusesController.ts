import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import CrmStatusService from 'App/Services/CrmStatusService';
import SharedService from 'App/Services/SharedService';
import CreateCrmStatusValidator from 'App/Validators/CrmStatus/CreateCrmStatusValidator';
import UpdateCrmStatusValidator from 'App/Validators/CrmStatus/UpdateCrmStatusValidator';

@inject()
export default class CrmStatusesController {
  constructor(
    private sharedService: SharedService,
    private service: CrmStatusService,
  ) {}

  async index({ auth, request, response }: HttpContextContract) {
    const qs = request.qs();

    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      {
        description: qs.description,
      },
    );

    return response.ok(result);
  }

  async show({ auth, params, response }: HttpContextContract) {
    const result = await this.service.show(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(result);
  }

  async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateCrmStatusValidator);

    await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created();
  }

  async update({ auth, params, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateCrmStatusValidator);

    await this.service.update(
      await this.sharedService.getAuthContext(auth),

      params.id,
      payload,
    );

    return response.noContent();
  }

  async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.destroy(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }
}
