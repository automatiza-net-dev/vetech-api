import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import AuthService from 'App/Services/AuthService';
import SharedService from 'App/Services/SharedService';
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
    private readonly sharedService: SharedService,
  ) {}

  public async login({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(LoginValidator);

    const result = await this.authService.login(payload, auth);

    return response.ok(result);
  }

  public async register({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(CreateUserValidator);
    const { user, unit, system } = await this.service.store(payload);

    const token = await auth.use('api').generate(user, {
      expiresIn: '7d',
      unit_id: unit.id,
      system_id: system.id,
    });

    return response.created(token);
  }

  public async whoAmI({ auth, response }: HttpContextContract) {
    const { user, unit_id } = this.sharedService.extractUser(auth);

    const unit = await BusinessUnit.query()
      .where('id', unit_id)
      .preload('unitConfig')
      .firstOrFail();

    const economicGroup = await EconomicGroup.query()
      .where('id', unit.economicGroupId)
      .preload('system', query => {
        query.preload('systemUrls', query => {
          query.select(['id', 'url', 'active']);
        });
      })
      .firstOrFail();

    const userRoles = await user
      .related('roles')
      .query()
      .where('active', true)
      .where('unit_id', unit_id)
      .preload('role', query => {
        query.where('active', true);

        query.preload('permissions', query => {
          query.where('active', true);
          query.where('status', true);
        });
      });

    const controlIds = userRoles
      .map(r => r.role.permissions.map(p => p.control_id))
      .flat()
      .filter(Boolean);

    return response.ok({
      user,
      unit,
      url: economicGroup.system.systemUrls.at(0) ?? null,
      cl: controlIds,
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
