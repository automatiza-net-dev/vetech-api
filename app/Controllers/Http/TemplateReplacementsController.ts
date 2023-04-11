import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import TemplateReplacementService from 'App/Services/TemplateReplacementService';
import CreateTemplateReplacementValidator from 'App/Validators/TemplateReplacement/CreateTemplateReplacementValidator';
import RenderTemplateReplacementValidator from 'App/Validators/TemplateReplacement/RenderTemplateReplacementValidator';
import UpdateTemplateReplacementValidator from 'App/Validators/TemplateReplacement/UpdateTemplateReplacementValidator';

@inject()
export default class TemplateReplacementsController {
  constructor(
    private readonly service: TemplateReplacementService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const qs = request.qs();
    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      {
        attribute: qs.attribute,
        origin: qs.origin,
        replacer: qs.replacer,
      },
    );

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateTemplateReplacementValidator);

    const result = await this.service.store(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateTemplateReplacementValidator);

    const result = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      payload,
    );

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    await this.service.destroy(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }

  public async renderTemplateReplacement({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(RenderTemplateReplacementValidator);

    const result = await this.service.renderText(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

    return response.ok({ result });
  }
}
