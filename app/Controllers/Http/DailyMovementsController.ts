import { inject } from '@adonisjs/fold';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import DailyMovementService from 'App/Services/DailyMovementService';
import SharedService from 'App/Services/SharedService';
import CheckDailyMovementValidator from 'App/Validators/DailyMovement/CheckDailyMovementValidator';
import CloseDailyMovementValidator from 'App/Validators/DailyMovement/CloseDailyMovementValidator';
import OpenDailyMovementValidator from 'App/Validators/DailyMovement/OpenDailyMovementValidator';

@inject()
export default class DailyMovementsController {
  constructor(
    private sharedService: SharedService,
    private service: DailyMovementService,
  ) {}

  public async index({ auth, request, response }) {
    const qs = request.qs();
    const dailyMovements = await this.service.index(
      await this.sharedService.getAuthContext(auth),
      {
        from: qs.from,
        to: qs.to,
      },
    );

    return response.ok(dailyMovements);
  }

  public async search({ auth, request, response }) {
    const dailyMovements = await this.service.search(
      await this.sharedService.getAuthContext(auth),
      request.qs(),
    );
    return response.ok(dailyMovements);
  }

  public async openDailyMovement({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const data = await request.validate(OpenDailyMovementValidator);
    const dailyMovement = await this.service.openDailyMovement(
      await this.sharedService.getAuthContext(auth),
      data,
    );

    return response.created(dailyMovement);
  }

  public async closeDailyMovement({
    auth,
    request,
    response,
    params,
  }: HttpContextContract) {
    const data = await request.validate(CloseDailyMovementValidator);
    const dailyMovement = await this.service.closeDailyMovement(
      await this.sharedService.getAuthContext(auth),
      params.id,
      data,
    );

    return response.ok(dailyMovement);
  }

  public async reopenDailyMovement({
    auth,
    response,
    params,
  }: HttpContextContract) {
    const dailyMovement = await this.service.reopenDailyMovement(
      await this.sharedService.getAuthContext(auth),
      params.id,
    );

    return response.ok(dailyMovement);
  }

  public async checkDailyMovement({
    auth,
    request,
    response,
    params,
  }: HttpContextContract) {
    const data = await request.validate(CheckDailyMovementValidator);
    const dailyMovement = await this.service.checkDailyMovement(
      await this.sharedService.getAuthContext(auth),
      params.id,
      data,
    );

    return response.ok(dailyMovement);
  }
}
