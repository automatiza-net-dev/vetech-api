import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import BankingService from 'App/Services/BankingService';
import SharedService from 'App/Services/SharedService';
import UpsertBankingValidator from 'App/Validators/Banking/UpsertBankingValidator';

@inject()
export default class BankingsController {
  constructor(
    private sharedService: SharedService,
    private service: BankingService,
  ) {}

  async index({ auth, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const result = await this.service.index(unit_id);

    return response.ok(result);
  }

  async storeBanking({ auth, request, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);
    const payload = await request.validate(UpsertBankingValidator);

    const result = await this.service.storeBanking(unit_id, user, payload);

    return response.created(result);
  }

  async updateBanking({
    auth,
    params,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);
    const payload = await request.validate(UpsertBankingValidator);

    const result = await this.service.updateBanking(
      unit_id,
      user,
      params.id,
      payload,
    );

    return response.ok(result);
  }
}
