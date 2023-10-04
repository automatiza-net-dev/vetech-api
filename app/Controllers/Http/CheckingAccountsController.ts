import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import CheckingAccountService from 'App/Services/CheckingAccountService';
import SharedService from 'App/Services/SharedService';
import OpenCheckingAccountValidator from 'App/Validators/CheckingAccount/OpenCheckingAccountValidator';
import UpdateCheckingAccountBalanceValidator from 'App/Validators/CheckingAccount/UpdateCheckingAccountBalanceValidator';
import UpdateCheckingAccountValidator from 'App/Validators/CheckingAccount/UpdateCheckingAccountValidator';

@inject()
export default class CheckingAccountsController {
  constructor(
    private sharedService: SharedService,
    private service: CheckingAccountService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const qs = request.qs();
    const account = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      {
        name: qs.name,
        bank: qs.bank,
        type: qs.type,
      },
    );

    return response.ok(account);
  }

  public async show({ auth, params, response }: HttpContextContract) {
    const account = await this.service.show(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(account);
  }

  public async check({ auth, params, response }: HttpContextContract) {
    const account = await this.service.checkBalance(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(account);
  }

  public async openAccount({ auth, request, response }: HttpContextContract) {
    const data = await request.validate(OpenCheckingAccountValidator);
    const account = await this.service.openAccount(
      await this.sharedService.getAuthContext(auth),
      data,
    );

    return response.created(account);
  }

  public async updateAccount({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const data = await request.validate(UpdateCheckingAccountValidator);
    const account = await this.service.updateAccount(
      await this.sharedService.getAuthContext(auth),
      params.id,
      data,
    );

    return response.ok(account);
  }

  public async updateAccountBalance({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const data = await request.validate(UpdateCheckingAccountBalanceValidator);
    const account = await this.service.updateBalance(
      await this.sharedService.getAuthContext(auth),
      params.id,
      data,
    );

    return response.ok(account);
  }

  public async deleteAccount({ auth, params, response }: HttpContextContract) {
    await this.service.deleteAccount(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.noContent();
  }
}
