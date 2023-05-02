import { inject } from '@adonisjs/fold';
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import ServiceService from 'App/Services/ServiceService';
import SharedService from 'App/Services/SharedService';
import CreateServiceValidator from 'App/Validators/Service/CreateServiceValidator';
import UpdateServiceValidator from 'App/Validators/Service/UpdateServiceValidator';

@inject()
export default class ServicesController {
  constructor(
    private readonly service: ServiceService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);
    const qs = request.qs();
    const result = await this.service.index(authCtx, {
      description: qs.description,
      active: qs.active,
      subgroup: qs.subgroup,
      taxation: qs.taxation,
    });

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);
    const result = await this.service.show(authCtx, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateServiceValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);
    const result = await this.service.store(authCtx, payload);

    return response.created(result);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateServiceValidator);
    const authCtx = await this.sharedService.getAuthContext(auth);
    const result = await this.service.update(authCtx, params.id, payload);

    return response.ok(result);
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);
    await this.service.destroy(authCtx, params.id);

    return response.noContent();
  }
}
