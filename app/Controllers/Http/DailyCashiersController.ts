import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import DailyCashierService from 'App/Services/DailyCashierService';
import SharedService from 'App/Services/SharedService';
import CheckDailyCashierValidator from 'App/Validators/DailyCashier/CheckDailyCashierValidator';
import ClearPaymentValidator from 'App/Validators/DailyCashier/ClearPaymentValidator';
import CloseDailyCashierValidator from 'App/Validators/DailyCashier/CloseDailyCashierValidator';
import CreateCashierExpenseValidator from 'App/Validators/DailyCashier/CreateCashierExpenseValidator';
import CreateCashierReceiptValidator from 'App/Validators/DailyCashier/CreateCashierReceiptValidator';
import OpenDailyCashierValidator from 'App/Validators/DailyCashier/OpenDailyCashierValidator';
import ReviewDailyCashierValidator from 'App/Validators/DailyCashier/ReviewDailyCashierValidator';
import UpdatePaymentConferenceValidator from 'App/Validators/DailyCashier/UpdatePaymentConferenceValidator';

@inject()
export default class DailyCashiersController {
  constructor(
    private sharedService: SharedService,
    private service: DailyCashierService,
  ) {}

  public async index({ auth, request, response }: HttpContextContract) {
    const qs = request.qs();
    const dailyMovement = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      qs,
    );

    return response.ok(dailyMovement);
  }

  public async dump({ auth, response, params }: HttpContextContract) {
    const result = await this.service.dump(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(result);
  }

  public async check({ auth, params, response }: HttpContextContract) {
    const result = await this.service.listSaleItems(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(result);
  }

  public async openDailyCashier({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const data = await request.validate(OpenDailyCashierValidator);
    const dailyMovement = await this.service.openDailyCashier(
      await this.sharedService.getAuthContext(auth),
      data,
    );

    return response.created(dailyMovement);
  }

  public async closeDailyCashier({
    auth,
    request,
    response,
    params,
  }: HttpContextContract) {
    const data = await request.validate(CloseDailyCashierValidator);
    const dailyMovement = await this.service.closeDailyCashier(
      await this.sharedService.getAuthContext(auth),
      params.id,
      data,
    );

    return response.ok(dailyMovement);
  }

  public async reopenDailyCashier({
    auth,
    response,
    params,
  }: HttpContextContract) {
    const dailyMovement = await this.service.reopenDailyCashier(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(dailyMovement);
  }

  public async checkDailyCashier({
    auth,
    request,
    response,
    params,
  }: HttpContextContract) {
    const authCtx = await this.sharedService.getAuthContext(auth);
    const data = await request.validate(CheckDailyCashierValidator);
    const dailyMovement = await this.service.checkDailyCashier(
      authCtx,
      params.id,
      data,
    );

    return response.ok(dailyMovement);
  }

  public async reviewDailyCashier({
    auth,
    request,
    response,
    params,
  }: HttpContextContract) {
    const data = await request.validate(ReviewDailyCashierValidator);
    const dailyMovement = await this.service.reviewDailyCashier(
      await this.sharedService.getAuthContext(auth),
      params.id,
      data,
    );

    return response.ok(dailyMovement);
  }

  public async createCashierExpense({
    auth,
    request,
    response,
    params,
  }: HttpContextContract) {
    const data = await request.validate(CreateCashierExpenseValidator);
    await this.service.createCashierExpenseEntry(
      await this.sharedService.getAuthContext(auth),
      params.id,
      data,
    );

    return response.noContent();
  }

  public async createCashierReceipt({
    auth,
    request,
    response,
    params,
  }: HttpContextContract) {
    const data = await request.validate(CreateCashierReceiptValidator);
    await this.service.createCashierReceiptEntry(
      await this.sharedService.getAuthContext(auth),
      params.id,
      data,
    );

    return response.noContent();
  }

  public async updateConference({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const data = await request.validate(UpdatePaymentConferenceValidator);
    await this.service.updateCashierPaymentsConference(
      await this.sharedService.getAuthContext(auth),
      data,
    );

    return response.noContent();
  }
}
