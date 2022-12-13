import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import FinanceService from 'App/Services/FinanceService';
import SharedService from 'App/Services/SharedService';
import UpdateFinanceDownValidator from 'App/Validators/Finance/UpdateFinanceDownValidator';
import UpdateFinanceReversalValidator from 'App/Validators/Finance/UpdateFinanceReversalValidator';
import UpdateFinanceValidator from 'App/Validators/Finance/UpdateFinanceValidator';
import UpsertFinanceValidator from 'App/Validators/Finance/UpsertFinanceValidator';

@inject()
export default class FinancesController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: FinanceService,
  ) {}

  async index({ auth, request, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    const qs = request.qs();
    const result = await this.service.index(unit_id, {
      accept: qs.accept,
      client: qs.client,
      document: qs.document,
      fromExpirationDate: qs.fromExpiration,
      toExpirationDate: qs.toExpiration,
      fiscalNote: qs.fiscalNote,
      fromIssueDate: qs.fromIssue,
      toIssueDate: qs.toIssue,
      nsu: qs.nsu,
      fromPaymentDate: qs.fromPayment,
      toPaymentDate: qs.toPayment,
      paymentMethod: qs.paymentMethod,
      status: qs.status,
      type: qs.type,
      reconciled: qs.reconciled,
      plan: qs.plan,
      unit: qs.unit,
      competence: qs.competence,
    });

    return response.ok(result);
  }
  async storeFinance({ auth, request, response }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);
    const payload = await request.validate(UpsertFinanceValidator);

    const result = await this.service.createFinance(unit_id, user, payload);

    return response.created(result);
  }

  async updateFinance({
    params,
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id, user } = this.sharedService.extractUser(auth);
    const payload = await request.validate(UpdateFinanceValidator);

    const result = await this.service.updateFinance(
      unit_id,
      user,
      params.id,
      payload,
    );

    return response.ok(result);
  }

  async updateFinanceDown({
    params,
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const payload = await request.validate(UpdateFinanceDownValidator);

    const result = await this.service.updateFinanceDown(
      unit_id,
      params.id,
      payload,
    );

    return response.ok(result);
  }

  async updateFinanceReversal({
    params,
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const payload = await request.validate(UpdateFinanceReversalValidator);

    const result = await this.service.updateFinanceReversal(
      unit_id,
      params.id,
      payload,
    );

    return response.ok(result);
  }

  async deleteFinance({ params, auth, response }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);

    await this.service.deleteFinance(unit_id, params.id);

    return response.noContent();
  }
}
