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
    const { unit_id } = this.sharedService.extractUser(auth);

    const search = request.qs();
    const result = await this.service.index(unit_id, search);

    return response.ok(result);
  }

  public async store({ request, response, auth }: HttpContextContract) {
    const data = await request.validate(CreateClientOriginValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const client = await this.service.store(unit_id, data);

    return response.created(client);
  }

  public async show({ auth, response, params }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const client = await this.service.show(unit_id, params.id);

    return response.ok(client);
  }

  public async update({
    auth,
    request,
    response,
    params,
  }: HttpContextContract) {
    const data = await request.validate(UpdateClientOriginValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const client = await this.service.update(unit_id, params.id, data);

    return response.ok(client);
  }

  public async destroy({ auth, response, params }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    await this.service.destroy(unit_id, params.id);

    return response.noContent();
  }
}
