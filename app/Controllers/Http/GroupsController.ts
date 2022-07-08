import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import GroupService from 'App/Services/GroupService';
import SharedService from 'App/Services/SharedService';
import CreateGroupValidator from 'App/Validators/Group/CreateGroupValidator';

@inject()
export default class GroupsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: GroupService,
  ) {}

  public async index({ auth, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.index(unit_id);

    return response.ok(result);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.show(unit_id, params.id);

    return response.ok(result);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateGroupValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, payload);

    return response.created(result);
  }
}
