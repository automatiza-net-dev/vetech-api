import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import SharedService from 'App/Services/SharedService';
import UserService from 'App/Services/UserService';
import UpdateUserValidator from 'App/Validators/User/UpdateUserValidator';

@inject()
export default class UsersController {
  constructor(
    private readonly service: UserService,
    private readonly sharedService: SharedService,
  ) {}

  public async index({ response }: HttpContextContract) {
    return response.ok(await this.service.index());
  }

  public async show({ params, response }: HttpContextContract) {
    const { id } = params;
    const user = await this.service.show(id);
    return response.ok(user);
  }

  public async checkEmail({ params, response }: HttpContextContract) {
    const { email } = params;
    const existing = await this.service.checkExistingEmail(email);

    return response.ok({
      success: true,
      inUse: existing,
    });
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
