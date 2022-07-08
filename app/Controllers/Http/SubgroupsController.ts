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

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateSubgroupValidator);
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
    const payload = await request.validate(UpdateSubgroupValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.update(unit_id, params.id, payload);

    return response.ok(result);
  }
}
