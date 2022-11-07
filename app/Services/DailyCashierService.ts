import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import DailyCashier, { DailyCashierStatus } from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import SharedService from 'App/Services/SharedService';
import {
  ICheckCashierData,
  ICloseCashierData,
  IOpenCashierData,
  IReviewCashierData,
} from 'Contracts/interfaces/IDailyCashierData';

@inject()
export default class DailyCashierService {
  constructor(private readonly sharedService: SharedService) {}

  async openDailyCashier(unitId: string, data: IOpenCashierData) {
    // já validado no request, nunca vai "falhar"
    const dailyMovement = await DailyMovement.findOrFail(data.dailyMovementId);

    if (dailyMovement.status !== DailyMovementStatus.A) {
      throw new BadRequestException(
        'Movimento diário não está aberto',
        400,
        'E_DAILY_MOVEMENT_NOT_OPENED',
      );
    }

    const existingCashier = await dailyMovement
      .related('cashiers')
      .query()
      .where('user_who_opened_id', data.userId)
      .where('status', DailyCashierStatus.A)
      .first();

    if (existingCashier) {
      throw new BadRequestException(
        'Caixa já está aberto para este usuário',
        400,
        'E_DAILY_CASHIER_ALREADY_OPENED',
      );
    }

    return dailyMovement.related('cashiers').create({
      business_unit_id: unitId,
      user_who_opened_id: data.userId,
      openingDate: data.openingDate,
      status: DailyCashierStatus.A,
    });
  }

  async closeDailyCashier(unitId: string, id: string, data: ICloseCashierData) {
    const dailyCashier = await DailyCashier.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!dailyCashier) {
      throw this.sharedService.ResourceNotFound('Caixa diário não encontrado');
    }

    if (dailyCashier.status !== DailyCashierStatus.A) {
      throw new BadRequestException(
        'Caixa diário não está aberto',
        400,
        'E_DAILY_CASHIER_NOT_OPENED',
      );
    }

    dailyCashier.status = DailyCashierStatus.F;
    dailyCashier.closingDate = data.closingDate;
    dailyCashier.user_who_closed_id = data.userId;
    dailyCashier.cashierTotal = data.cashierTotal;
    dailyCashier.expensesTotal = 0; // calculate after new table
    dailyCashier.receiptsTotal = 0; // calculate after new table
    dailyCashier.cashierBalance =
      dailyCashier.openingBalance +
      data.cashierTotal +
      dailyCashier.receiptsTotal -
      dailyCashier.expensesTotal;

    return dailyCashier.save();
  }

  async reopenDailyCashier(unitId: string, id: string, userId: string) {
    const dailyCashier = await DailyCashier.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!dailyCashier) {
      throw this.sharedService.ResourceNotFound('Caixa diário não encontrado');
    }

    if (
      ![DailyCashierStatus.F, DailyCashierStatus.R].includes(
        dailyCashier.status,
      )
    ) {
      throw new BadRequestException(
        'Caixa diário não está fechado',
        400,
        'E_DAILY_CASHIER_NOT_CLOSED',
      );
    }

    const openCashier = await DailyCashier.query()
      .where('business_unit_id', unitId)
      .where('user_who_opened_id', userId)
      .whereNot('id', id)
      .where('status', DailyCashierStatus.A)
      .first();
    if (openCashier) {
      throw new BadRequestException(
        'Já existe um caixa diário aberto para este usuário',
        400,
        'E_DAILY_CASHIER_ALREADY_OPENED',
      );
    }

    await dailyCashier.related('logs').create({
      business_unit_id: unitId,
      user_who_closed_id: dailyCashier.user_who_closed_id,
      user_who_reopened_id: userId,
      openingBalance: dailyCashier.openingBalance,
      cashierFunds: dailyCashier.cashierFunds,
      salesTotal: dailyCashier.salesTotal,
      receiptsTotal: dailyCashier.receiptsTotal,
      cashierTotal: dailyCashier.cashierTotal,
      cashierBalance: dailyCashier.cashierBalance,
      observations: dailyCashier.observations,
    });

    dailyCashier.merge({
      status: DailyCashierStatus.A,
      salesTotal: 0,
      expensesTotal: 0,
      receiptsTotal: 0,
      cashierTotal: 0,
      cashierBalance: 0,
    });

    return dailyCashier.save();
  }

  async checkDailyCashier(unitId: string, id: string, data: ICheckCashierData) {
    const dailyCashier = await DailyCashier.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!dailyCashier) {
      throw this.sharedService.ResourceNotFound('Caixa diário não encontrado');
    }

    if (dailyCashier.status !== DailyCashierStatus.F) {
      throw new BadRequestException(
        'Caixa diário não está fechado',
        400,
        'E_DAILY_CASHIER_NOT_CLOSED',
      );
    }

    dailyCashier.merge({
      user_who_checked_id: data.userId,
      status: DailyCashierStatus.C,
      observations: [dailyCashier.observations, data.observations].join(' - '),
    });

    return dailyCashier.save();
  }

  async reviewDailyCashier(
    unitId: string,
    id: string,
    data: IReviewCashierData,
  ) {
    const dailyCashier = await DailyCashier.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!dailyCashier) {
      throw this.sharedService.ResourceNotFound('Caixa diário não encontrado');
    }

    if (dailyCashier.status !== DailyCashierStatus.F) {
      throw new BadRequestException(
        'Caixa diário não está fechado',
        400,
        'E_DAILY_CASHIER_NOT_CLOSED',
      );
    }

    dailyCashier.merge({
      user_who_revised_id: data.userId,
      status: DailyCashierStatus.R,
      revisionDate: data.revisionDate,
      observations: [dailyCashier.observations, data.observations].join(' - '),
    });

    return dailyCashier.save();
  }
}
