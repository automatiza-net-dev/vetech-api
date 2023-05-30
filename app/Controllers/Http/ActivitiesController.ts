import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ActivityService from 'App/Services/ActivityService';
import SharedService from 'App/Services/SharedService';
import CreateActivityValidator from 'App/Validators/Activity/CreateActivityValidator';
import UpdateActivityValidator from 'App/Validators/Activity/UpdateActivityValidator';

@inject()
export default class ActivitysController {
  constructor(
    private sharedService: SharedService,
    private service: ActivityService,
  ) {}

  async index({ auth, request, response }: HttpContextContract) {
    const qs = request.qs();

    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      {
        description: qs.description,
        active: qs.active,
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
    const payload = await request.validate(CreateActivityValidator);

    await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created();
  }

  async update({ auth, params, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateActivityValidator);

    await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      payload,
    );

    return response.noContent();
  }

  async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.delete(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }
}
