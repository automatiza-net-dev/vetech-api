import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import SharedService from 'App/Services/SharedService';
import {
  ICheckedDailyMovementData,
  ICloseDailyMovementData,
  IOpenDailyMovementData,
} from 'Contracts/interfaces/IDailyMovementData';
import { isSameDay } from 'date-fns';

@inject()
export default class DailyMovementService {
  constructor(private sharedService: SharedService) {}

  async index(unitId: string) {
    return DailyMovement.query()
      .where('business_unit_id', unitId)
      .orderBy('openingDate', 'desc')
      .preload('userWhoOpened')
      .preload('userWhoClosed')
      .preload('userWhoChecked');
  }

  async openDailyMovement(unitId: string, data: IOpenDailyMovementData) {
    const lastDailyMovement = await DailyMovement.query()
      .where('business_unit_id', unitId)
      .orderBy('opening_date', 'desc')
      .first();

    if (lastDailyMovement) {
      const shortDate = lastDailyMovement.openingDate.toJSDate();
      const sameDay = isSameDay(shortDate, new Date());

      if (!sameDay && lastDailyMovement.status === DailyMovementStatus.A) {
        throw new BadRequestException(
          'Existe um movimento diário aberto do dia anterior',
          400,
          'E_DAILY_MOVEMENT_OPENED',
        );
      }

      if (sameDay) {
        throw new BadRequestException(
          'Já existe um movimento diário aberto para hoje',
          400,
          'E_DAILY_MOVEMENT_OPENED',
        );
      }
    }

    return DailyMovement.create({
      business_unit_id: unitId,
      user_who_opened_id: data.userId,
      openingDate: data.openingDate,
      status: DailyMovementStatus.A,
    });
  }

  async closeDailyMovement(
    unitId: string,
    id: string,
    data: ICloseDailyMovementData,
  ) {
    const dailyMovement = await DailyMovement.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!dailyMovement) {
      throw this.sharedService.ResourceNotFound(
        'Movimento diário não encontrado',
      );
    }

    if (dailyMovement.status !== DailyMovementStatus.A) {
      throw new BadRequestException(
        'Movimento diário não está aberto',
        400,
        'E_DAILY_MOVEMENT_NOT_OPENED',
      );
    }

    dailyMovement.status = DailyMovementStatus.F;
    dailyMovement.closingDate = data.closingDate;
    dailyMovement.observations = data.observations;
    dailyMovement.user_who_closed_id = data.userId;
    // TODO - Calculate totals

    return dailyMovement.save();
  }

  async reopenDailyMovement(unitId: string, id: string) {
    const dailyMovement = await DailyMovement.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!dailyMovement) {
      throw this.sharedService.ResourceNotFound(
        'Movimento diário não encontrado',
      );
    }

    if (dailyMovement.status === DailyMovementStatus.C) {
      throw new BadRequestException(
        'Movimento diário já foi conferido',
        400,
        'E_DAILY_MOVEMENT_CHECKED',
      );
    }

    if (!isSameDay(dailyMovement.openingDate.toJSDate(), new Date())) {
      throw new BadRequestException(
        'Movimento diário só pode ser reaberto no mesmo dia',
        400,
        'E_DAILY_MOVEMENT_NOT_SAME_DAY',
      );
    }

    dailyMovement.status = DailyMovementStatus.A;
    dailyMovement.closingDate = null;
    dailyMovement.observations = '';
    dailyMovement.user_who_closed_id = null;
    dailyMovement.salesTotal = 0;
    dailyMovement.expensesTotal = 0;
    dailyMovement.receiptsTotal = 0;

    return dailyMovement.save();
  }

  async checkDailyMovement(
    unitId: string,
    id: string,
    data: ICheckedDailyMovementData,
  ) {
    const dailyMovement = await DailyMovement.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!dailyMovement) {
      throw this.sharedService.ResourceNotFound(
        'Movimento diário não encontrado',
      );
    }

    if (dailyMovement.status !== DailyMovementStatus.F) {
      throw new BadRequestException(
        'Movimento diário não está fechado',
        400,
        'E_DAILY_MOVEMENT_NOT_CLOSED',
      );
    }

    dailyMovement.status = DailyMovementStatus.C;
    dailyMovement.checkingDate = data.checkingDate;
    dailyMovement.user_who_checked_id = data.userId;
    dailyMovement.observations = dailyMovement.observations
      ? `${dailyMovement.observations} - ${data.observations}`
      : data.observations;

    return dailyMovement.save();
  }
}
