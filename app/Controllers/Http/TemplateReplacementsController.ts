import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import TemplateReplacementService from 'App/Services/TemplateReplacementService';
import CreateTemplateReplacementValidator from 'App/Validators/TemplateReplacement/CreateTemplateReplacementValidator';
import UpdateTemplateReplacementValidator from 'App/Validators/TemplateReplacement/UpdateTemplateReplacementValidator';
import UserTemplateReplacementValidator from 'App/Validators/TemplateReplacement/UserTemplateReplacementValidator';

@inject()
export default class TemplateReplacementsController {
  constructor(
    private readonly service: TemplateReplacementService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, {
      attribute: qs.attribute,
      origin: qs.origin,
      replacer: qs.replacer,
    });

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateTemplateReplacementValidator);
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
    const payload = await request.validate(UpdateTemplateReplacementValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.update(unit_id, params.id, payload);

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }

  public async userTemplateReplacement({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UserTemplateReplacementValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.replaceUser(unit_id, payload);

    return response.ok({ result });
  }
}
