import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import EconomicGroup from 'App/Models/EconomicGroup';
import AuthService from 'App/Services/AuthService';
import SharedService from 'App/Services/SharedService';
import UserService from 'App/Services/UserService';
import LoginValidator from 'App/Validators/Auth/LoginValidator';
import SwapUnitValidator from 'App/Validators/Auth/SwapUnitValidator';
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
    if (process.env.NODE_ENV === 'development') {
      console.log(request.headers());
    }

    const payload = await request.validate(LoginValidator);

    const result = await this.authService.login(
      payload,
      auth,
      payload.ipAddress,
    );

    return response.ok(result);
  }

  public async controllerLogin({
    auth,
    request,
    response,
  }: HttpContextContract) {
    if (process.env.NODE_ENV === 'development') {
      console.log(request.headers());
    }

    const payload = await request.validate(LoginValidator);

    const result = await this.authService.controllerLogin(
      payload,
      auth,
      payload.ipAddress,
    );

    return response.ok(result);
  }

  public async swapUnit({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(SwapUnitValidator);
    const { token } = auth.use('api');

    await this.authService.swapUnit(
      await this.sharedService.getAuthContext(auth),
      token!,
      payload,
    );

    return response.noContent();
  }

  public async swapTpUnit({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(SwapUnitValidator);

    const { token } = auth.use('api');

    await this.authService.swapTpUnit(token!, payload);

    return response.noContent();
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
    const { user, unit, system } = await this.sharedService.getAuthContext(
      auth,
    );

    const economicGroup = await EconomicGroup.query()
      .where('id', unit.economicGroupId)
      .preload('system', query => {
        query.preload('systemUrls', query => {
          query.select(['id', 'url', 'active']);
        });
      })
      .firstOrFail();
    await unit.load('unitConfig', query => {
      query.select([
        'id',
        'requires_schedule_tutor',
        'requires_bill_patient',
        'allow_change_schedule_duration',
        'interval',
        'locked_daily_movement_date',
        'daily_cashier_type',
      ]);
    });

    const userRoles = await this.authService.getRoles(user, system.id, false);

    const controlIds = userRoles
      .map(r => r.role.permissions.map(p => p.control_id))
      .flat()
      .filter(Boolean);
    const uniqueControls = Array.from(new Set(controlIds));

    return response.ok({
      user,
      unit,
      url: economicGroup.system.systemUrls.at(0) ?? null,
      cl: uniqueControls,
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
