import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import InvoiceService from 'App/Services/InvoiceService';
import CreateInviteValidator from 'App/Validators/Invite/CreateInviteValidator';

@inject()
export default class InvitesController {
  constructor(private readonly service: InvoiceService) {}

  public async store({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateInviteValidator);
    const user = auth.use('api').user!;

    const invite = await this.service.store(user, payload);

    return response.created(invite);
  }
}
