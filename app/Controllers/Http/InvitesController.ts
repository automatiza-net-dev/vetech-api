import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import InviteService from 'App/Services/InviteService';
import SharedService from 'App/Services/SharedService';
import AcceptInviteNewUserValidator from 'App/Validators/Invite/AcceptInviteNewUserValidator';
import AcceptInviteValidator from 'App/Validators/Invite/AcceptInviteValidator';
import CreateInviteValidator from 'App/Validators/Invite/CreateInviteValidator';
import UpdateInviteValidator from 'App/Validators/Invite/UpdateInviteValidator';

@inject()
export default class InvitesController {
  constructor(
    private readonly service: InviteService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ auth, response }: HttpContextContract) {
    const { user, unit_id } = this.sharedService.extractUser(auth);

    const invite = await this.service.index(user, unit_id);

    return response.ok(invite);
  }

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateInviteValidator);
    const { user } = this.sharedService.extractUser(auth);

    const invite = await this.service.store(user, payload);

    return response.created(invite);
  }

  public async show({ params, response }: HttpContextContract) {
    const invite = await this.service.show(params.id);

    return response.ok(invite);
  }

  public async check({ params, response }: HttpContextContract) {
    const data = await this.service.check(params.id);

    return response.ok(data);
  }

  public async update({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(UpdateInviteValidator);
    const { user } = this.sharedService.extractUser(auth);

    const invite = await this.service.update(params.id, user, payload);

    return response.ok(invite);
  }

  public async acceptInvite({ request, response }: HttpContextContract) {
    const payload = await request.validate(AcceptInviteValidator);

    await this.service.acceptInvite(payload);

    return response.noContent();
  }

  public async acceptInviteNewUser({ request, response }: HttpContextContract) {
    const payload = await request.validate(AcceptInviteNewUserValidator);

    await this.service.acceptInviteForNewUser(payload);

    return response.noContent();
  }

  public async destroy({ auth, params, response }: HttpContextContract) {
    const { user } = this.sharedService.extractUser(auth);

    await this.service.destroy(params.id, user);

    return response.noContent();
  }
}
