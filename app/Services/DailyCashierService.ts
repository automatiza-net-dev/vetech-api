import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import DailyCashier, { DailyCashierStatus } from 'App/Models/DailyCashier';
import {
  DailyCashierEntryStatus,
  DailyCashierEntryType,
} from 'App/Models/DailyCashierEntry';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import { PaymentMethodTef } from 'App/Models/PaymentMethod';
import SharedService from 'App/Services/SharedService';
import {
  ICheckCashierData,
  ICloseCashierData,
  ICreateCashierExpenseEntryData,
  ICreateCashierReceiptEntryData,
  IOpenCashierData,
  IReviewCashierData,
} from 'Contracts/interfaces/IDailyCashierData';
import { DateTime } from 'luxon';

interface ISearch {
  movement?: string;
  status?: string;
  from?: string;
  to?: string;
}

@inject()
export default class DailyCashierService {
  constructor(private readonly sharedService: SharedService) {}

  async listSaleItems(unitId: string, id: string) {
    const dailyCashier = await DailyCashier.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .preload('businessUnit')
      .preload('userWhoOpened')
      .preload('userWhoClosed')
      .preload('userWhoChecked')
      .preload('userWhoRevised')
      .preload('entries')
      .preload('bills', query => {
        query.preload('client');
        query.preload('payments', query => {
          query.preload('paymentMethod');
        });
      })
      .first();

    if (!dailyCashier) {
      throw this.sharedService.ResourceNotFound('Caixa diário não encontrado');
    }

    return {
      cashier: {
        id: dailyCashier.id,
        unit: {
          id: dailyCashier.businessUnit.id,
          name: dailyCashier.businessUnit.fantasyName,
          company: dailyCashier.businessUnit.companyName,
        },
        tag: dailyCashier.tag,

        opening_user: dailyCashier.userWhoOpened
          ? {
              id: dailyCashier.userWhoOpened.id,
              name: dailyCashier.userWhoOpened.name,
            }
          : null,
        opening_date: dailyCashier.openingDate,

        closing_user: dailyCashier.userWhoClosed
          ? {
              id: dailyCashier.userWhoClosed.id,
              name: dailyCashier.userWhoClosed.name,
            }
          : null,
        closing_date: dailyCashier.closingDate,

        checking_user: dailyCashier.userWhoChecked
          ? {
              id: dailyCashier.userWhoChecked.id,
              name: dailyCashier.userWhoChecked.name,
            }
          : null,
        checking_date: dailyCashier.checkingDate,

        revision_user: dailyCashier.userWhoRevised
          ? {
              id: dailyCashier.userWhoRevised.id,
              name: dailyCashier.userWhoRevised.name,
            }
          : null,
        revision_date: dailyCashier.revisionDate,

        opening_balance: dailyCashier.openingBalance,
        sales_total: dailyCashier.salesTotal,
        expenses_total: dailyCashier.expensesTotal,
        receipts_total: dailyCashier.receiptsTotal,

        cashier_funds: dailyCashier.cashierFunds,
        cashier_balance: dailyCashier.cashierBalance,
        observations: dailyCashier.observations,
        status: dailyCashier.status,
      },
      expenses: dailyCashier.entries
        .filter(e => e.type === DailyCashierEntryType.D)
        .map(e => {
          return {
            id: e.id,
            entry_date: e.entryDate,
            description: e.description,
            value: e.value,
            status: e.status,
            created_at: e.createdAt,
          };
        }),
      receipts: dailyCashier.entries
        .filter(e => e.type === DailyCashierEntryType.C)
        .map(e => {
          return {
            id: e.id,
            entry_date: e.entryDate,
            description: e.description,
            value: e.value,
            status: e.status,
            created_at: e.createdAt,
          };
        }),
      bill_payments: {
        tef_pos: dailyCashier.bills
          .reduce((acc, bill) => {
            const tefs = bill.payments.filter(p =>
              [PaymentMethodTef.P, PaymentMethodTef.T].includes(
                p.paymentMethod.tef,
              ),
            );
            return [...acc, ...tefs];
          }, [])
          .reduce((acc, curr) => {
            if (acc[curr.payment_method_id]) {
              acc[curr.payment_method_id][curr.flag.id] = {
                flag: {
                  id: curr.flag.id,
                  description: curr.flag.description,
                },
                payments: [curr],
              };
            }

            const elem = acc[curr.payment_method_id];
            const subelem = elem[curr.flag.id];
            if (subelem) {
              subelem.payments.push(curr);
            } else {
              subelem.payments = [curr];
            }

            return acc;
          }, {}),
        no_tef: dailyCashier.bills
          .reduce((acc, bill) => {
            const no_tefs = bill.payments.filter(p =>
              [PaymentMethodTef.N].includes(p.paymentMethod.tef),
            );
            return [...acc, ...no_tefs];
          }, [])
          .reduce((acc, curr) => {
            if (acc[curr.payment_method_id]) {
              acc[curr.payment_method_id].payments.push(curr);
              return acc;
            }

            acc[curr.payment_method_id] = {
              payments: [curr],
            };
            return acc;
          }, {}),
      },
      // 2.10.5
      payments: dailyCashier.bills.map(bill => {
        return bill.payments.map(p => ({
          id: p.id,
          description: p.paymentMethod.description,
          flag: {
            id: p.flag.id,
            description: p.flag.id,
          },
          type: p.paymentMethod.type,
          created_at: p.createdAt,
          installments: p.installments,
          client: {
            id: bill.client.id,
            name: bill.client.name,
          },
          installment_value: p.installmentValue,
        }));
      }),
    };
  }

  async index(unitId: string, data: ISearch) {
    const query = DailyCashier.query()
      .where('business_unit_id', unitId)
      .preload('userWhoOpened')
      .preload('userWhoClosed')
      .preload('userWhoRevised')
      .preload('userWhoChecked')
      .preload('entries');

    if (data.movement) {
      query.whereHas('dailyMovement', builder => {
        builder.where('id', data.movement as string);
      });
    }

    if (data.status) {
      query.where('status', data.status);
    }

    if (data.from) {
      query.where('created_at', '>=', data.from);
    }

    if (data.to) {
      query.where('created_at', '<=', data.to);
    }

    return query;
  }

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

    const count = await DailyCashier.query()
      .where('business_unit_id', unitId)
      .select(['id']);

    return dailyMovement.related('cashiers').create({
      business_unit_id: unitId,
      user_who_opened_id: data.userId,
      openingDate: data.openingDate,
      status: DailyCashierStatus.A,
      tag: count.length + 1,
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

    const entries = await dailyCashier.related('entries').query();

    const expensesTotal = entries
      .filter(entry => entry.type === DailyCashierEntryType.D)
      .reduce(
        (total, entry) => total + parseFloat(entry.value as unknown as string),
        0,
      );
    const receiptsTotal = entries
      .filter(entry => entry.type === DailyCashierEntryType.C)
      .reduce(
        (total, entry) => total + parseFloat(entry.value as unknown as string),
        0,
      );

    dailyCashier.status = DailyCashierStatus.F;
    dailyCashier.closingDate = data.closingDate;
    dailyCashier.user_who_closed_id = data.userId;

    dailyCashier.salesTotal = 0; // TODO fix this
    dailyCashier.expensesTotal = expensesTotal;
    dailyCashier.receiptsTotal = receiptsTotal;
    dailyCashier.cashierTotal = data.cashierTotal;
    dailyCashier.cashierBalance =
      dailyCashier.openingBalance +
      dailyCashier.salesTotal +
      receiptsTotal -
      expensesTotal;

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

    return Database.transaction(async trx => {
      await dailyCashier.related('logs').create(
        {
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
          tag: dailyCashier.tag,
        },
        {
          client: trx,
        },
      );

      return dailyCashier
        .merge({
          status: DailyCashierStatus.A,
          salesTotal: 0,
          expensesTotal: 0,
          receiptsTotal: 0,
          cashierTotal: 0,
          cashierBalance: 0,
          closingDate: null,
          user_who_closed_id: null,
        })
        .useTransaction(trx)
        .save();
    });
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

    return dailyCashier
      .merge({
        user_who_checked_id: data.userId,
        status: DailyCashierStatus.C,
        observations: [dailyCashier.observations, data.observations].join(
          ' - ',
        ),
        checkingDate: DateTime.now(),
      })
      .save();
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

  async createCashierExpenseEntry(
    unitId: string,
    id: string,
    data: ICreateCashierExpenseEntryData,
  ) {
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

    await dailyCashier.related('entries').create({
      type: DailyCashierEntryType.D,
      business_unit_id: unitId,
      description: data.description,
      value: data.value,
      status: DailyCashierEntryStatus.A,
      entryDate: data.entryDate,
      tag: dailyCashier.tag,
    });
  }

  async createCashierReceiptEntry(
    unitId: string,
    id: string,
    data: ICreateCashierReceiptEntryData,
  ) {
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

    await dailyCashier.related('entries').create({
      type: DailyCashierEntryType.C,
      business_unit_id: unitId,
      description: data.description,
      value: data.value,
      status: DailyCashierEntryStatus.A,
      entryDate: data.entryDate,
      tag: dailyCashier.tag,
    });
  }
}
