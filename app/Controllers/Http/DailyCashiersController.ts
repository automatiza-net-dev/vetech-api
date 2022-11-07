import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import DailyCashierService from 'App/Services/DailyCashierService';
import SharedService from 'App/Services/SharedService';
import CloseDailyCashierValidator from 'App/Validators/DailyCashier/CloseDailyCashierValidator';
import OpenDailyCashierValidator from 'App/Validators/DailyCashier/OpenDailyCashierValidator';
import ReviewDailyCashierValidator from 'App/Validators/DailyCashier/ReviewDailyCashierValidator';
import CheckDailyMovementValidator from 'App/Validators/DailyMovement/CheckDailyMovementValidator';

@inject()
export default class DailyCashiersController {
  constructor(
    private sharedService: SharedService,
    private service: DailyCashierService,
  ) {}

  public async openDailyCashier({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const data = await request.validate(OpenDailyCashierValidator);
    const dailyMovement = await this.service.openDailyCashier(unit_id, data);

    return response.created(dailyMovement);
  }

  public async closeDailyCashier({
    auth,
    request,
    response,
    params,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const data = await request.validate(CloseDailyCashierValidator);
    const dailyMovement = await this.service.closeDailyCashier(
      unit_id,
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
    const { unit_id, user } = this.sharedService.extractUser(auth);
    const dailyMovement = await this.service.reopenDailyCashier(
      unit_id,
      params.id,
      user.id,
    );

    return response.ok(dailyMovement);
  }

  public async checkDailyCashier({
    auth,
    request,
    response,
    params,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const data = await request.validate(CheckDailyMovementValidator);
    const dailyMovement = await this.service.checkDailyCashier(
      unit_id,
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
    const { unit_id } = this.sharedService.extractUser(auth);
    const data = await request.validate(ReviewDailyCashierValidator);
    const dailyMovement = await this.service.reviewDailyCashier(
      unit_id,
      params.id,
      data,
    );

    return response.ok(dailyMovement);
  }
}
