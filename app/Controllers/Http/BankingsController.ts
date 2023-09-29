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

  async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();

    const result = await this.service.index(unit_id, {
      type: qs.type,
      reconciled: qs.reconciled,
      account: qs.account,
      competence: qs.competence,
      document: qs.document,
      from: qs.from,
      to: qs.to,
    });

    return response.ok(result);
  }

  async storeBanking({ auth, request, response }: HttpContextContract) {
    const payload = await request.validate(UpsertBankingValidator);

    const result = await this.service.storeBanking(
      await this.sharedService.getAuthContext(auth),
      payload,
    );

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
