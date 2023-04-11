import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ClientOriginService from 'App/Services/ClientOriginService';
import SharedService from 'App/Services/SharedService';
import CreateClientOriginValidator from 'App/Validators/ClientOrigin/CreateClientOriginValidator';
import UpdateClientOriginValidator from 'App/Validators/ClientOrigin/UpdateClientOriginValidator';

@inject()
export default class ClientOriginsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: ClientOriginService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const search = request.qs();
    const result = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      search,
    );

    return response.ok(result);
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const data = await request.validate(CreateClientOriginValidator);

    const client = await this.service.store(
      await this.sharedService.getAuthContext(auth),
      data,
    );

    return response.created(client);
  }

  public async show({ auth, response, params }: HttpContextContract) {
    const client = await this.service.show(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(client);
  }

  public async update({
    auth,
    request,
    response,
    params,
  }: HttpContextContract) {
    const data = await request.validate(UpdateClientOriginValidator);

    const client = await this.service.update(
      await this.sharedService.getAuthContext(auth),
      params.id,
      data,
    );

    return response.ok(client);
  }

  public async destroy({ auth, response, params }: HttpContextContract) {
    await this.service.destroy(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }
}
