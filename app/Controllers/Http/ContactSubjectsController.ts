import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ContactSubjectService from 'App/Services/ContactSubjectService';
import SharedService from 'App/Services/SharedService';
import CreateContactSubjectValidator from 'App/Validators/ContactSubject/CreateContactSubjectValidator';
import UpdateContactSubjectValidator from 'App/Validators/ContactSubject/UpdateContactSubjectValidator';
import CreateContactTypeValidator from 'App/Validators/ContactType/CreateContactTypeValidator';

@inject()
export default class ContactSubjectsController {
  constructor(
    private sharedService: SharedService,
    private service: ContactSubjectService,
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
    const payload = await request.validate(CreateContactSubjectValidator);

    await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created();
  }

  async update({ auth, params, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateContactSubjectValidator);

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
