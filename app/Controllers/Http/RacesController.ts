import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import RaceService from 'App/Services/RaceService';
import SharedService from 'App/Services/SharedService';
import CreateRaceValidator from 'App/Validators/Race/CreateRaceValidator';
import UpdateRaceValidator from 'App/Validators/Race/UpdateRaceValidator';

@inject()
export default class RacesController {
  constructor(
    private readonly service: RaceService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const qs = request.qs();
    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      {
        description: qs.description,
        specie: qs.specie,
        fur: qs.fur,
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
    const payload = await request.validate(CreateRaceValidator);

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
    const payload = await request.validate(UpdateRaceValidator);

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
