import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import Banking, { BankingStatus, BankingType } from 'App/Models/Banking';
import CheckingAccount from 'App/Models/CheckingAccount';
import DailyCashier from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import Finance, {
  FinanceAccept,
  FinanceOriginFlag,
  FinanceStatus,
  FinanceType,
} from 'App/Models/Finance';
import PaymentMethod from 'App/Models/PaymentMethod';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import { IUpsertBankingData } from 'Contracts/interfaces/IBankingData';
import { DateTime } from 'luxon';

interface ISearch {
  type?: string;
  reconciled?: string;
  account?: string;
  competence?: string;
  document?: string;

  from?: string;
  to?: string;
}

@inject()
export default class BankingService {
  constructor(private sharedService: SharedService) {}

  async index(unitId: string, data: ISearch) {
    const qb = Banking.query().where('business_unit_id', unitId);

    if (data.type) {
      qb.where('type', data.type);
    }

    if (data.reconciled) {
      qb.where('reconciled', data.reconciled === 'true');
    }

    if (data.account) {
      qb.where('checking_account_id', data.account);
    }

    if (data.competence) {
      qb.where('competence_date', data.competence);
    }

    if (data.document) {
      qb.whereILike('document', `%${data.document}%`);
    }

    if (data.from) {
      qb.where('issue_date', '>=', data.from);
    }

    if (data.to) {
      qb.where('issue_date', '<=', data.to);
    }

    qb.preload('checkingAccount')
      .preload('paymentMethod')
      .preload('client')
      .preload('accountPlan');

    return qb;
  }

  async storeBanking(unitId: string, user: User, data: IUpsertBankingData) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const paymentMethod = await PaymentMethod.findOrFail(
        data.paymentMethodId,
        {
          client: trx,
        },
      );

      const dailyMovement = await DailyMovement.query()
        .useTransaction(trx)
        .where('business_unit_id', unitId)
        .where('status', DailyMovementStatus.A)
        .first();

      const dailyCashier = await DailyCashier.query()
        .useTransaction(trx)
        .where('business_unit_id', unitId)
        .where('status', DailyMovementStatus.A)
        .where('user_who_opened_id', user.id)
        .first();

      const checkingAccount = await CheckingAccount.findOrFail(
        data.checkingAccountId,
        {
          client: trx,
        },
      );

      const discount = data.documentValue * (paymentMethod.fee / 100);

      const total =
        data.documentValue +
        (data.feeValue || 0) -
        (data.discountValue || 0) -
        discount;

      const finance = await Finance.create(
        {
          economic_group_id: group.id,
          business_unit_id: unitId,
          client_id: data.clientId,
          type: FinanceType[data.type],
          account_plan_id: data.accountPlanId,
          payment_method_id: data.paymentMethodId,
          checking_account_id: data.checkingAccountId,
          daily_movement_id: dailyMovement?.id,
          daily_cashier_id: dailyCashier?.id,

          document: data.document,
          historic: data.historic,
          issueDate: data.issueDate,
          expirationDate: data.issueDate,
          originalValue: data.documentValue,
          value: data.documentValue,
          totalValue: total,
          accept: FinanceAccept.S,
          installment: data.installment,
          originFlag: FinanceOriginFlag[data.originFlag],
          paymentDate: DateTime.now(),
          downDate: data.issueDate,
          paymentValue: total,
          feeValue: data.feeValue,
          feePercentage: data.feePercentage,
          discountValue: data.discountValue,
          discountPercentage: data.discountPercentage,
          additionValue: 0,
          additionPercentage: 0,
          status: FinanceStatus.B,
          feeDiscountPercentage: paymentMethod.fee,
          feeDiscountValue: discount,
          observation: data.observation,
          competenceDate: data.competenceDate,
          fiscalNote: data.fiscalNote,
          userDocument: data.userDocument,
          nsuDocument: data.nsuDocument,
          barCode: data.barCode,
        },
        {
          client: trx,
        },
      );

      const existingBankingsBefore = await Banking.query()
        .where('economic_group_id', group.id)
        .where('issue_date', '<', data.issueDate.toJSDate())
        .orderBy('issue_date', 'desc');
      const prevBalance = existingBankingsBefore.at(0)?.balance ?? 0;

      const existingBankingsAfter = await Banking.query()
        .where('economic_group_id', group.id)
        .where('issue_date', '>', data.issueDate.toJSDate())
        .orderBy('issue_date', 'desc');

      if (existingBankingsAfter.length > 0) {
        const promises = existingBankingsAfter.map(eb => {
          const newPrevBalance =
            eb.type === BankingType.C
              ? eb.prevBalance + total
              : eb.prevBalance - total;
          const sum =
            eb.type === BankingType.C
              ? newPrevBalance + total
              : newPrevBalance - total;

          return eb
            .merge({
              prevBalance: newPrevBalance,
              balance: sum,
            })
            .useTransaction(trx)
            .save();
        });

        await Promise.all(promises);
      }

      const banking = await Banking.create(
        {
          economic_group_id: group.id,
          business_unit_id: unitId,
          client_id: data.clientId,
          account_plan_id: data.accountPlanId,
          payment_method_id: data.paymentMethodId,
          checking_account_id: data.checkingAccountId,
          daily_movement_id: dailyMovement?.id,
          daily_cashier_id: dailyCashier?.id,
          finance_id: finance.id,

          type: data.type,
          document: data.document,
          historic: data.historic,
          issueDate: data.issueDate,
          documentValue: data.documentValue,
          feeValue: data.feeValue,
          feePercentage: data.feePercentage,
          discountValue: data.discountValue,
          discountPercentage: data.discountPercentage,
          reconciled: data.reconciled,
          installment: data.installment,
          originFlag: data.originFlag,

          observation: data.observation,

          totalValue: total,
          status: BankingStatus.B,
          prevBalance,
          balance:
            data.type === BankingType.C
              ? prevBalance + total
              : prevBalance - total,
          paymentMethodDiscountPercentage: paymentMethod.fee,
          paymentMethodDiscountValue: discount,
          competenceDate: data.competenceDate,
          fiscalNote: data.fiscalNote,
          userDocument: data.userDocument,
          nsuDocument: data.nsuDocument,
          barCode: data.barCode,
        },
        {
          client: trx,
        },
      );

      await finance
        .merge({
          banking_id: banking.id,
        })
        .useTransaction(trx)
        .save();

      await checkingAccount
        .merge({
          balance:
            data.type === BankingType.C
              ? checkingAccount.balance + total
              : checkingAccount.balance - total,
        })
        .useTransaction(trx)
        .save();

      return banking;
    });
  }

  async updateBanking(
    unitId: string,
    user: User,
    id: string,
    data: IUpsertBankingData,
  ) {
    const banking = await Banking.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();
    if (!banking) {
      throw this.sharedService.ResourceNotFound();
    }

    const paymentMethod = await PaymentMethod.findOrFail(data.paymentMethodId);
    const dailyMovement = await DailyMovement.query()
      .where('business_unit_id', unitId)
      .where('status', DailyMovementStatus.A)
      .first();
    const dailyCashier = await DailyCashier.query()
      .where('business_unit_id', unitId)
      .where('status', DailyMovementStatus.A)
      .where('user_who_opened_id', user.id)
      .first();
    const checkingAccount = await CheckingAccount.findOrFail(
      data.checkingAccountId,
    );

    const discount = data.documentValue * (paymentMethod.fee / 100);

    const total =
      data.documentValue +
      (data.feeValue || 0) -
      (data.discountValue || 0) -
      discount;
    const prevBalance = checkingAccount.balance;

    banking
      .merge({
        client_id: data.clientId,
        account_plan_id: data.accountPlanId,
        payment_method_id: data.paymentMethodId,
        checking_account_id: data.checkingAccountId,
        daily_movement_id: dailyMovement?.id,
        daily_cashier_id: dailyCashier?.id,

        type: data.type,
        document: data.document,
        historic: data.historic,
        issueDate: data.issueDate,
        documentValue: data.documentValue,
        feeValue: data.feeValue,
        feePercentage: data.feePercentage,
        discountValue: data.discountValue,
        discountPercentage: data.discountPercentage,
        reconciled: data.reconciled,
        installment: data.installment,
        originFlag: data.originFlag,

        observation: data.observation,
        competenceDate: data.competenceDate,
        fiscalNote: data.fiscalNote,
        userDocument: data.userDocument,
        nsuDocument: data.nsuDocument,
        barCode: data.barCode,

        totalValue: total,
        status: BankingStatus.B,
        prevBalance,
        balance:
          data.type === BankingType.C
            ? prevBalance + total
            : prevBalance - total,
        paymentMethodDiscountPercentage: paymentMethod.fee,
        paymentMethodDiscountValue: discount,
      })
      .save();

    return banking;
  }
}
