import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import MedicalDocumentTemplateService from 'App/Services/MedicalDocumentTemplateService';
import SharedService from 'App/Services/SharedService';
import CreateMedicalDocumentTemplateValidator from 'App/Validators/MedicalDocumentTemplate/CreateMedicalDocumentTemplateValidator';
import UpdateMedicalDocumentTemplateValidator from 'App/Validators/MedicalDocumentTemplate/UpdateMedicalDocumentTemplateValidator';

@inject()
export default class MedicalDocumentTemplatesController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: MedicalDocumentTemplateService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();

    const result = await this.service.index(unit_id, {
      title: qs.title,
      description: qs.description,
    });

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(
      CreateMedicalDocumentTemplateValidator,
    );
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, payload);

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(
      UpdateMedicalDocumentTemplateValidator,
    );
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.update(unit_id, params.id, payload);

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }
}
