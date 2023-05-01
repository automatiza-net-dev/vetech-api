import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import SubgroupService from 'App/Services/SubgroupService';
import CreateSubgroupValidator from 'App/Validators/Subgroup/CreateSubgroupValidator';
import UpdateSubgroupValidator from 'App/Validators/Subgroup/UpdateSubgroupValidator';

@inject()
export default class SubgroupsController {
  constructor(
    private readonly service: SubgroupService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const qs = request.qs();
    const result = await this.service.index(authCtx, {
      description: qs.description,
    });

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);

    const result = await this.service.show(authCtx, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateSubgroupValidator);
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
    const payload = await request.validate(UpdateSubgroupValidator);
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
