import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { inject } from '@adonisjs/fold';
import SharedService from 'App/Services/SharedService';
import BusinessUnitMetaService from 'App/Services/BusinessUnitMetaService';
import CreateMetaValidator from 'App/Validators/BusinessUnitMeta/CreateMetaValidator';
import UpdateMetaValidator from 'App/Validators/BusinessUnitMeta/UpdateMetaValidator';

@inject()
export default class BusinessUnitMetasController {
  constructor(
    private sharedService: SharedService,
    private service: BusinessUnitMetaService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const data = await this.service.index(authCtx, request.qs());

    return response.ok(data);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateMetaValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);
    const data = await this.service.store(authCtx, payload);

    return response.created(data);
  }

  public async show({ auth, request, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);
    const data = await this.service.show(authCtx, request.param('id'));

    return response.ok(data);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateMetaValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);
    await this.service.update(authCtx, params.id, payload);

    return response.noContent();
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);
    await this.service.destroy(authCtx, params.id);

    return response.noContent();
  }
}
