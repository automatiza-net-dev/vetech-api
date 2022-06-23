import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BusinessUnit from 'App/Models/BusinessUnit';
import AuthService from 'App/Services/AuthService';
import UserService from 'App/Services/UserService';
import LoginValidator from 'App/Validators/Auth/LoginValidator';
import CreateUserValidator from 'App/Validators/User/CreateUserValidator';
import ForgotPasswordValidator from 'App/Validators/User/ForgotPasswordValidator';
import ResetPasswordValidator from 'App/Validators/User/ResetPasswordValidator';

@inject()
export default class AuthController {
  constructor(
    private readonly service: UserService,
    private readonly authService: AuthService,
  ) {}

  public async login({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(LoginValidator);

    const result = await this.authService.login(payload, auth);

    return response.ok(result);
  }

  public async register({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateUserValidator);
    const created = await this.service.store(payload);

    const token = await auth.use('api').generate(created, {
      expiresIn: '1h',
    });

    return response.created(token);
  }

  public async whoAmI({ auth, response }: HttpContextContract) {
    const user = auth.use('api').user!;

    return response.ok({
      user,
      unit: await BusinessUnit.find(auth.use('api').token!.meta.unit_id),
    });
  }

  public async forgotPassword({ request, response }: HttpContextContract) {
    const payload = await request.validate(ForgotPasswordValidator);
    await this.service.forgotPassword(payload);

    return response.noContent();
  }

  public async resetPassword({ request, response }: HttpContextContract) {
    const payload = await request.validate(ResetPasswordValidator);
    await this.service.resetPassword(payload);

    return response.noContent();
  }
}
