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

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateGroupValidator);
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.store(unit_id, payload);

    return response.created(result);
  }
}
