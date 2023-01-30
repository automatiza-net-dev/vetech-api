import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import UserService from 'App/Services/UserService';
import ConfirmConfirmationTokenValidator from 'App/Validators/User/ConfirmConfirmationTokenValidator';
import CreateConfirmationTokenValidator from 'App/Validators/User/CreateConfirmationTokenValidator';
import UpdateUserValidator from 'App/Validators/User/UpdateUserValidator';

@inject()
export default class UsersController {
  constructor(
    private readonly service: UserService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ request, response }: HttpContextContract) {
    const qs = request.qs();

    return response.ok(
      await this.service.index({
        name: qs.name,
        email: qs.email,
        document: qs.document,
        phone: qs.phone,
      }),
    );
  }

  public async show({ params, response }: HttpContextContract) {
    const { id } = params;
    const user = await this.service.show(id);
    return response.ok(user);
  }

  public async checkEmail({ params, response }: HttpContextContract) {
    const { email } = params;
    const result = await this.service.checkExistingEmail(email);

    return response.ok(result);
  }

  public async resendConfirmationToken({
    params,
    response,
  }: HttpContextContract) {
    const { email } = params;
    await this.service.resendConfirmationToken(email);

    return response.noContent();
  }

  public async createConfirmationToken({
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(CreateConfirmationTokenValidator);
    await this.service.createConfirmationToken(payload);

    return response.noContent();
  }

  public async confirmConfirmationToken({
    request,
    response,
  }: HttpContextContract) {
    const payload = await request.validate(ConfirmConfirmationTokenValidator);
    await this.service.confirmConfirmationToken(payload);

    return response.noContent();
  }

  public async update({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(UpdateUserValidator);
    const { user } = this.sharedService.extractUser(auth);

    const updatedUser = await this.service.update(user, payload);

    return response.ok(updatedUser);
  }

  public async destroy({ auth, response }: HttpContextContract) {
    const { user } = this.sharedService.extractUser(auth);

    await this.service.delete(user);

    return response.noContent();
  }
}
