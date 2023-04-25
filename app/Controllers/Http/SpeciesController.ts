import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import SpecieService from 'App/Services/SpecieService';
import CreateSpecieValidator from 'App/Validators/Specie/CreateSpecieValidator';
import UpdateSpecieValidator from 'App/Validators/Specie/UpdateSpecieValidator';

@inject()
export default class SpeciesController {
  constructor(
    private readonly service: SpecieService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const qs = request.qs();
    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      {
        description: qs.description,
      },
    );

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const result = await this.service.show(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateSpecieValidator);

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
    const payload = await request.validate(UpdateSpecieValidator);

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
}
