import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ContactTypeService from 'App/Services/ContactTypeService';
import SharedService from 'App/Services/SharedService';
import CreateContactTypeValidator from 'App/Validators/ContactType/CreateContactTypeValidator';
import UpdateContactTypeValidator from 'App/Validators/ContactType/UpdateContactTypeValidator';

@inject()
export default class ContactTypesController {
  constructor(
    private sharedService: SharedService,
    private service: ContactTypeService,
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
    const payload = await request.validate(CreateContactTypeValidator);

    await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created();
  }

  async update({ auth, params, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateContactTypeValidator);

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
