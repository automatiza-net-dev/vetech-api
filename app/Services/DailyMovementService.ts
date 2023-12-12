import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import { DailyCashierStatus } from 'App/Models/DailyCashier';
import { DailyCashierEntryType } from 'App/Models/DailyCashierEntry';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import {
  ICheckedDailyMovementData,
  ICloseDailyMovementData,
  IOpenDailyMovementData,
} from 'Contracts/interfaces/IDailyMovementData';
import { isSameDay } from 'date-fns';
import { DateTime } from 'luxon';

interface ISearch {
  from?: string;
  to?: string;
}

@inject()
export default class DailyMovementService {
  constructor(private sharedService: SharedService) {}

  async index(authCtx: AuthContext, data: ISearch) {
    const qb = DailyMovement.query()
      .where('business_unit_id', authCtx.unit.id)
      .orderBy('openingDate', 'desc')
      .preload('userWhoOpened', query => query.select('id', 'name', 'email'))
      .preload('userWhoClosed', query => query.select('id', 'name', 'email'))
      .preload('userWhoChecked', query => query.select('id', 'name', 'email'))
      .preload('logs', query => {
        query.preload('userWhoReopened', query => {
          query.select('id', 'name', 'email');
        });

        query.preload('userWhoClosed', query => {
          query.select('id', 'name', 'email');
        });
      });

    if (data.from) {
      qb.where('created_at', '>=', data.from);
    }

    if (data.to) {
      qb.where('created_at', '<=', data.to);
    }

    return qb;
  }

  async search(
    authCtx: AuthContext,
    data: {
      groupId?: string;
      unitId?: string;
      from?: string;
      to?: string;
      status?: string;
    },
  ) {
    const qb = DailyMovement.query()
      .where('business_unit_id', authCtx.unit.id)
      .orderBy('openingDate', 'desc')
      .preload('userWhoOpened', query => query.select('id', 'name', 'email'))
      .preload('userWhoClosed', query => query.select('id', 'name', 'email'))
      .preload('userWhoChecked', query => query.select('id', 'name', 'email'))
      .preload('logs', query => {
        query.preload('userWhoReopened', query => {
          query.select('id', 'name', 'email');
        });

        query.preload('userWhoClosed', query => {
          query.select('id', 'name', 'email');
        });
      });

    if (data.groupId) {
      qb.whereHas('unit', query => {
        query.where('economic_group_id', data.groupId!);
      });
    }

    if (data.unitId) {
      qb.where('business_unit_id', data.unitId);
    }

    if (data.status) {
      qb.where('status', data.status);
    }

    if (data.from) {
      qb.where('created_at', '>=', data.from);
    }

    if (data.to) {
      qb.where('created_at', '<=', data.to);
    }

    return qb;
  }

  async openDailyMovement(authCtx: AuthContext, data: IOpenDailyMovementData) {
    const someOpen = await DailyMovement.query()
      .where('business_unit_id', authCtx.unit.id)
      .whereRaw(
        `((status = 'Aberto') or (opening_date::date = now()::date))`,
        [],
      )
      .orderBy('opening_date', 'desc')
      .first();

    if (someOpen) {
      throw new BadRequestException(
        'Já existe um movimento diário aberto',
        400,
        'E_DAILY_MOVEMENT_OPENED',
      );
    }

    return DailyMovement.create({
      business_unit_id: authCtx.unit.id,
      user_who_opened_id: data.userId,
      openingDate: data.openingDate,
      status: DailyMovementStatus.A,
    });
  }

  async closeDailyMovement(
    authCtx: AuthContext,
    id: string,
    data: ICloseDailyMovementData,
  ) {
    const dailyMovement = await DailyMovement.query()
      .where('id', id)
      .where('business_unit_id', authCtx.unit.id)
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

    const cashiers = await dailyMovement
      .related('cashiers')
      .query()
      .preload('entries');

    const hasOpenCashier = cashiers.some(
      cashier => cashier.status === DailyCashierStatus.A,
    );
    if (hasOpenCashier) {
      throw new BadRequestException(
        'Existe um caixa aberto',
        400,
        'E_DAILY_CASHIER_OPENED',
      );
    }

    const expenses = cashiers
      .map(cashier =>
        cashier.entries.filter(entry => entry.type === DailyCashierEntryType.D),
      )
      .flat();

    const receipts = cashiers
      .map(cashier =>
        cashier.entries.filter(entry => entry.type === DailyCashierEntryType.C),
      )
      .flat();

    return dailyMovement
      .merge({
        status: DailyMovementStatus.F,
        closingDate: data.closingDate,
        observations: data.observations,
        user_who_closed_id: data.userId,
        salesTotal: 0,
        expensesTotal: expenses.reduce(
          (total, expense) =>
            total + parseFloat(expense.value as unknown as string),
          0,
        ),
        receiptsTotal: receipts.reduce(
          (total, receipt) =>
            total + parseFloat(receipt.value as unknown as string),
          0,
        ),
      })
      .save();
  }

  async reopenDailyMovement(authCtx: AuthContext, id: string) {
    const dailyMovement = await DailyMovement.query()
      .where('id', id)
      .where('business_unit_id', authCtx.unit.id)
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

    if (authCtx.unit.unitConfig.lockedDailyMovementDate) {
      if (!isSameDay(dailyMovement.openingDate.toJSDate(), new Date())) {
        throw new BadRequestException(
          'Movimento diário só pode ser reaberto no mesmo dia',
          400,
          'E_DAILY_MOVEMENT_NOT_SAME_DAY',
        );
      }
    } else {
      const anotherOpenDailyMovement = await DailyMovement.query()
        .where('business_unit_id', authCtx.unit.id)
        .whereNot('id', id)
        .where('status', DailyMovementStatus.A)
        .first();

      if (anotherOpenDailyMovement) {
        throw new BadRequestException(
          'Já existe um movimento diário aberto',
          400,
          'E_DAILY_MOVEMENT_OPENED',
        );
      }
    }

    await dailyMovement.related('logs').create({
      user_who_reopened_id: authCtx.user.id,
      reopeningDate: DateTime.now(),
      user_who_closed_id: dailyMovement.user_who_closed_id as string,
      closingDate: dailyMovement.closingDate as DateTime,
      salesTotal: dailyMovement.salesTotal,
      expensesTotal: dailyMovement.expensesTotal,
      receiptsTotal: dailyMovement.receiptsTotal,
      observations: dailyMovement.observations,
    });

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
    authCtx: AuthContext,
    id: string,
    data: ICheckedDailyMovementData,
  ) {
    const dailyMovement = await DailyMovement.query()
      .where('id', id)
      .where('business_unit_id', authCtx.unit.id)
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
    dailyMovement.checkingDate = DateTime.now();

    return dailyMovement.save();
  }
}
