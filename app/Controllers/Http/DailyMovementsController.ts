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

  public async index({ auth, response }) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const dailyMovements = await this.service.index(unit_id);

    return response.ok(dailyMovements);
  }

  public async openDailyMovement({
    auth,
    request,
    response,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const data = await request.validate(OpenDailyMovementValidator);
    const dailyMovement = await this.service.openDailyMovement(unit_id, data);

    return response.created(dailyMovement);
  }

  public async closeDailyMovement({
    auth,
    request,
    response,
    params,
  }: HttpContextContract) {
    const { unit_id } = this.sharedService.extractUser(auth);
    const data = await request.validate(CloseDailyMovementValidator);
    const dailyMovement = await this.service.closeDailyMovement(
      unit_id,
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
    const { unit_id } = this.sharedService.extractUser(auth);
    const dailyMovement = await this.service.reopenDailyMovement(
      unit_id,
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
    const { unit_id } = this.sharedService.extractUser(auth);
    const data = await request.validate(CheckDailyMovementValidator);
    const dailyMovement = await this.service.checkDailyMovement(
      unit_id,
      params.id,
      data,
    );

    return response.ok(dailyMovement);
  }
}
