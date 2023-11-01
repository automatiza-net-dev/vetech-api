import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Attendance from 'App/Models/Attendance';
import Banking, {
  BankingOriginFlag,
  BankingStatus,
  BankingType,
} from 'App/Models/Banking';
import CheckingAccount from 'App/Models/CheckingAccount';
import DailyCashier, { DailyCashierStatus } from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import Finance, {
  FinanceAccept,
  FinanceOriginFlag,
  FinanceStatus,
  FinanceType,
} from 'App/Models/Finance';
import FinanceReversal, {
  FinanceReversalType,
} from 'App/Models/FinanceReversal';
import PaymentMethod from 'App/Models/PaymentMethod';
import User from 'App/Models/User';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import {
  IFinanceDownData,
  IFinanceReversalData,
  IUpdateFinance,
  IUpsertFinance,
} from 'Contracts/interfaces/IFinanceData';
import { DateTime } from 'luxon';

interface ISearch {
  fromIssueDate?: string;
  toIssueDate?: string;

  fromExpirationDate?: string;
  toExpirationDate?: string;

  fromPaymentDate?: string;
  toPaymentDate?: string;

  id?: string;
  client?: string;
  document?: string;
  fiscalNote?: string;
  paymentMethod?: string;
  nsu?: string;
  status?: string;
  accept?: string;
  reconciled?: string;
  type?: string;
  unit?: string;
  plan?: string;
  competence?: string;
}

@inject()
export default class FinanceService {
  constructor(private sharedService: SharedService) {}

  async index(unitId: string, data: ISearch) {
    const units = [unitId];
    if (data.unit) {
      units.push(data.unit);
    }

    const qb = Finance.query()
      .whereIn('business_unit_id', units)
      .preload('client', query => {
        query.preload('tutor', query => {
          query.preload('accountPlan');
        });
      })
      .preload('paymentMethod', query => {
        query.preload('checkingAccount', query => {
          query.select(['id', 'description']);
        });
      })
      .preload('accountPlan')
      .preload('checkingAccount')
      .preload('flag', query => {
        query.select(['id', 'description']);
      });

    if (data.id) {
      qb.where('id', data.id);
    }

    if (data.fromIssueDate) {
      qb.whereRaw('issue_date::date >= ?', [data.fromIssueDate]);
    }

    if (data.toIssueDate) {
      qb.whereRaw('issue_date::date <= ?', [data.toIssueDate]);
    }

    if (data.fromExpirationDate) {
      qb.whereRaw('expiration_date::date >= ?', [data.fromExpirationDate]);
    }

    if (data.toExpirationDate) {
      qb.whereRaw('expiration_date::date <= ?', [data.toExpirationDate]);
    }

    if (data.fromPaymentDate) {
      qb.whereRaw('payment_date::date >= ?', [data.fromPaymentDate]);
    }

    if (data.toPaymentDate) {
      qb.whereRaw('payment_date::date <= ?', [data.toPaymentDate]);
    }

    if (data.client) {
      qb.where('client_id', data.client);
    }

    if (data.document) {
      qb.whereILike('document', `%${data.document}%`);
    }

    if (data.fiscalNote) {
      qb.whereILike('fiscalNote', `%${data.fiscalNote}%`);
    }

    if (data.paymentMethod) {
      qb.where('payment_method_id', data.paymentMethod);
    }

    if (data.nsu) {
      qb.where('nsuDocument', data.nsu);
    }

    if (data.status) {
      qb.where('status', data.status);
    } else {
      qb.whereNot('status', FinanceStatus.E);
    }

    if (data.accept) {
      qb.where('accept', data.accept);
    }

    if (data.reconciled) {
      qb.where('reconciled', data.reconciled === 'true');
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    if (data.plan) {
      qb.where('account_plan_id', data.plan);
    }

    if (data.competence) {
      qb.where('competence_date', data.competence);
    }

    return qb;
  }

  // 2.1
  async createFinance(authCtx: AuthContext, data: IUpsertFinance) {
    if (authCtx.unit.unitConfig.requiresFinanceClient && !data.clientId) {
      throw new BadRequestException(
        'É preciso adicionar cliente na nota para essa unidade',
        400,
        'BAD_REQUEST',
      );
    }
    return await Database.transaction(async trx => {
      const paymentMethod = await PaymentMethod.findOrFail(
        data.paymentMethodId,
        {
          client: trx,
        },
      );
      const dailyMovement = await DailyMovement.query()
        .useTransaction(trx)
        .where('business_unit_id', authCtx.unit.id)
        .where('status', DailyMovementStatus.A)
        .first();

      const dailyCashier = await this.sharedService.getContextCashier(
        authCtx,
        trx,
      );

      const discount = data.originalValue * (paymentMethod.fee / 100);

      return Finance.create(
        {
          daily_movement_id: dailyMovement?.id,
          daily_cashier_id: dailyCashier?.id,
          status: FinanceStatus.A,
          feeDiscountPercentage: paymentMethod.fee,
          feeDiscountValue: discount,
          economic_group_id: authCtx.group.id,
          business_unit_id: authCtx.unit.id,
          client_id: data.clientId,
          type: data.type,
          account_plan_id: data.accountPlanId,
          payment_method_id: data.paymentMethodId,
          document: data.document,
          historic: data.historic,
          issueDate: data.issueDate,
          expirationDate: data.expirationDate,
          originalValue: data.originalValue,
          value: data.originalValue - discount,
          totalValue:
            data.originalValue +
            (data.feeValue || 0) +
            (data.increaseValue || 0) -
            (data.discountValue || 0) -
            discount,
          accept: data.accept,
          installment: data.installment,
          originFlag: data.originFlag,
          checking_account_id:
            data.checkingAccountId ?? paymentMethod.checkingAccountId,
          qtyInstallments: data.qtyInstallments,

          paymentDate: data.paymentDate,
          downDate: data.downDate,
          paymentValue: data.paymentValue,
          feeValue: data.feeValue ?? 0,
          feePercentage: data.feePercentage ?? 0,
          discountValue: data.discountValue ?? 0,
          discountPercentage: data.discountPercentage ?? 0,
          additionPercentage: data.increasePercentage,
          additionValue: data.increaseValue,
          observation: data.observation,
          competenceDate: data.competenceDate,
          fiscalNote: data.fiscalNote,
          userDocument: data.userDocument,
          nsuDocument: data.nsuDocument,
          barCode: data.barCode,
          bank: data.bank,
          agency: data.agency,
          account: data.account,
          acquirer_id: data.tefAcquirerId,
          tef_flag_id: data.tefFlagId,
        },
        {
          client: trx,
        },
      );
    });
  }

  // 2.1
  async createMultipleFinances(authCtx: AuthContext, data: IUpsertFinance[]) {
    if (
      authCtx.unit.unitConfig.requiresFinanceClient &&
      data.some(item => !item.clientId)
    ) {
      throw new BadRequestException(
        'É preciso adicionar cliente na nota para essa unidade',
        400,
        'BAD_REQUEST',
      );
    }

    await Database.transaction(async trx => {
      const tasks = data.map(async item => {
        const paymentMethod = await PaymentMethod.findOrFail(
          item.paymentMethodId,
          {
            client: trx,
          },
        );
        const dailyMovement = await DailyMovement.query()
          .useTransaction(trx)
          .where('business_unit_id', authCtx.unit.id)
          .where('status', DailyMovementStatus.A)
          .first();
        const dailyCashier = await DailyCashier.query()
          .useTransaction(trx)
          .where('business_unit_id', authCtx.unit.id)
          .where('status', DailyMovementStatus.A)
          .where('user_who_opened_id', authCtx.user.id)
          .first();

        const discount = item.originalValue * (paymentMethod.fee / 100);

        return Finance.create(
          {
            daily_movement_id: dailyMovement?.id,
            daily_cashier_id: dailyCashier?.id,
            status: FinanceStatus.A,
            feeDiscountPercentage: paymentMethod.fee,
            feeDiscountValue: discount,
            economic_group_id: authCtx.group.id,
            business_unit_id: authCtx.unit.id,
            client_id: item.clientId,
            type: item.type,
            account_plan_id: item.accountPlanId,
            payment_method_id: item.paymentMethodId,
            document: item.document,
            historic: item.historic,
            issueDate: item.issueDate,
            expirationDate: item.expirationDate,
            originalValue: item.originalValue,
            value: item.originalValue - discount,
            totalValue:
              item.originalValue +
              (item.feeValue || 0) +
              (item.increaseValue || 0) -
              (item.discountValue || 0) -
              discount,
            accept: item.accept,
            installment: item.installment,
            originFlag: item.originFlag,
            checking_account_id:
              item.checkingAccountId ?? paymentMethod.checkingAccountId,
            qtyInstallments: item.qtyInstallments,

            paymentDate: item.paymentDate,
            downDate: item.downDate,
            paymentValue: item.paymentValue,
            feeValue: item.feeValue ?? 0,
            feePercentage: item.feePercentage ?? 0,
            discountValue: item.discountValue ?? 0,
            discountPercentage: item.discountPercentage ?? 0,
            additionPercentage: item.increasePercentage,
            additionValue: item.increaseValue,
            observation: item.observation,
            competenceDate: item.competenceDate,
            fiscalNote: item.fiscalNote,
            userDocument: item.userDocument,
            nsuDocument: item.nsuDocument,
            barCode: item.barCode,
            bank: item.bank,
            agency: item.agency,
            account: item.account,
            acquirer_id: item.tefAcquirerId,
            tef_flag_id: item.tefFlagId,
          },
          {
            client: trx,
          },
        );
      });

      await Promise.all(tasks);
    });
  }

  // 2.2
  async updateFinance(
    unitId: string,
    _: User,
    id: string,
    data: IUpdateFinance,
  ) {
    const paymentMethod = await PaymentMethod.findOrFail(data.paymentMethodId);

    const discount = data.originalValue * (paymentMethod.fee / 100);

    const finance = await Finance.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!finance) {
      throw this.sharedService.ResourceNotFound();
    }

    return finance
      .merge({
        account_plan_id: data.accountPlanId,
        payment_method_id: data.paymentMethodId,
        historic: data.historic,
        expirationDate: data.expirationDate,
        originalValue: data.originalValue,
        value: data.originalValue - discount,
        totalValue:
          data.originalValue +
          (data.feeValue || finance.feeValue) +
          (data.increaseValue || finance.additionValue) -
          (data.discountValue || finance.discountValue) -
          discount,
        reconciled: data.reconciled,

        checking_account_id:
          paymentMethod.checkingAccountId ?? data.checkingAccountId,

        feeValue: data.feeValue ?? 0,
        feePercentage: data.feePercentage ?? 0,
        discountValue: data.discountValue ?? 0,
        discountPercentage: data.discountPercentage ?? 0,
        additionPercentage: data.increasePercentage,
        additionValue: data.increaseValue,
        observation: data.observation,
        competenceDate: data.competenceDate,
        fiscalNote: data.fiscalNote,
        userDocument: data.userDocument,
        nsuDocument: data.nsuDocument,
        barCode: data.barCode,
        bank: data.bank,
        agency: data.agency,
        account: data.account,
        acquirer_id: data.tefAcquirerId,
        tef_flag_id: data.tefFlagId,
      })
      .save();
  }

  async updateFinanceDown(
    authCtx: AuthContext,
    data: { items: IFinanceDownData[] },
  ) {
    return Database.transaction(async trx => {
      for await (const elem of data.items) {
        const finance = await Finance.query()
          .where('id', elem.financeId)
          .where('business_unit_id', authCtx.unit.id)
          .useTransaction(trx)
          .first();

        if (!finance) {
          throw this.sharedService.ResourceNotFound();
        }

        const checkingAccount = await CheckingAccount.query()
          .useTransaction(trx)
          .where('id', elem.checkingAccountId)
          .first();

        if (!checkingAccount) {
          throw this.sharedService.ResourceNotFound();
        }

        finance.merge({
          checking_account_id: elem.checkingAccountId,
          status: FinanceStatus.B,
          downDate: DateTime.now(),
          paymentValue: elem.paymentValue,
          paymentDate: elem.paymentDate,
          originDownFlag: elem.originDownFlag,

          feeValue: elem.feeValue ?? 0,
          feePercentage: elem.feePercentage ?? 0,
          discountValue: elem.discountValue ?? 0,
          discountPercentage: elem.discountPercentage ?? 0,

          additionPercentage: elem.increasePercentage,
          additionValue: elem.increaseValue,
          observation: elem.observation,

          competenceDate: elem.competenceDate,
          fiscalNote: elem.fiscalNote,
          userDocument: elem.userDocument,
          nsuDocument: elem.nsuDocument,
          barCode: elem.barCode,
          bank: elem.bank,
          agency: elem.agency,
          account: elem.account,
          acquirer_id: elem.tefAcquirerId,
          tef_flag_id: elem.tefFlagId,
        });

        const banking = await Banking.create(
          {
            economic_group_id: authCtx.group.id,
            business_unit_id: authCtx.unit.id,
            client_id: finance.client_id,
            account_plan_id: finance.account_plan_id,
            payment_method_id: finance.payment_method_id,
            checking_account_id: elem.checkingAccountId,
            daily_movement_id: finance.daily_movement_id,
            daily_cashier_id: finance.daily_cashier_id,
            finance_id: finance.id,

            paymentMethodDiscountValue: finance.feeDiscountValue,
            paymentMethodDiscountPercentage: finance.feeDiscountPercentage,

            type:
              finance.type === FinanceType.C ? BankingType.C : BankingType.D,
            document: finance.document,
            historic: finance.historic,
            issueDate: elem.paymentDate,
            documentValue: finance.value,
            feeValue: finance.feeValue,
            feePercentage: finance.feePercentage,
            discountValue: finance.discountValue,
            discountPercentage: finance.discountPercentage,
            totalValue: elem.paymentValue,
            reconciled: true,
            installment: finance.installment,
            originFlag: BankingOriginFlag.F,
            observation: finance.observation,
            status: BankingStatus.B,
            prevBalance: checkingAccount?.balance,
            balance:
              finance.type === FinanceType.C
                ? (checkingAccount?.balance ?? 0) + (finance.paymentValue ?? 0)
                : (checkingAccount?.balance ?? 0) - (finance.paymentValue ?? 0),

            competenceDate: finance.competenceDate,
            fiscalNote: finance.fiscalNote,
            userDocument: finance.userDocument,
            nsuDocument: finance.nsuDocument,
            barCode: finance.barCode,
          },
          {
            client: trx,
          },
        );

        await checkingAccount
          .merge({
            balance:
              finance.type === FinanceType.C
                ? checkingAccount.balance + (finance.paymentValue ?? 0)
                : checkingAccount.balance - (finance.paymentValue ?? 0),
          })
          .useTransaction(trx)
          .save();

        await FinanceReversal.create(
          {
            type: FinanceReversalType.B,
            downDate: DateTime.now(),
            reversalOrigin: elem.originDownFlag,

            economic_group_id: finance.economic_group_id,
            business_unit_id: finance.business_unit_id,
            finance_id: finance.id,
            client_id: finance.client_id,
            checking_account_id: finance.checking_account_id ?? undefined,
            account_plan_id: finance.account_plan_id,
            payment_method_id: finance.payment_method_id,
            banking_id: banking.id,

            feeDiscountPercentage: finance.feeDiscountPercentage,
            feeDiscountValue: finance.feeDiscountValue,
            expirationDate: finance.expirationDate,
            paymentDate: finance.paymentDate ?? undefined,
            totalValue: finance.totalValue,
            paymentValue: finance.paymentValue ?? undefined,
            feeValue: finance.feeValue,
            feePercentage: finance.feePercentage,
            discountValue: finance.discountValue,
            discountPercentage: finance.discountPercentage,
            additionPercentage: finance.additionPercentage,
            additionValue: finance.additionValue,

            competenceDate: finance.competenceDate,
            fiscalNote: finance.fiscalNote,
            userDocument: finance.userDocument,
            nsuDocument: finance.nsuDocument,
            barCode: finance.barCode,
            bank: finance.bank,
            agency: finance.agency,
            account: finance.account,
            tef_flag_id: finance.tef_flag_id,
            acquirer_id: finance.acquirer_id,
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
      }
    });
  }

  // 2.7
  async updateFinanceReversal(
    unitId: string,
    id: string,
    data: IFinanceReversalData,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const finance = await Finance.query()
        .where('id', id)
        .where('business_unit_id', unitId)
        .first();

      if (!finance) {
        throw this.sharedService.ResourceNotFound();
      }

      const checkingAccount = await CheckingAccount.find(
        finance.checking_account_id,
      );

      const balance = checkingAccount?.balance ?? 0;

      const banking = await Banking.create(
        {
          economic_group_id: group.id,
          business_unit_id: unitId,
          client_id: finance.client_id,
          account_plan_id: finance.account_plan_id,
          payment_method_id: finance.payment_method_id,
          checking_account_id: finance.checking_account_id ?? undefined,
          daily_movement_id: finance.daily_movement_id,
          daily_cashier_id: finance.daily_cashier_id,
          finance_id: finance?.id,

          paymentMethodDiscountValue: finance.feeDiscountValue,
          paymentMethodDiscountPercentage: finance.feeDiscountPercentage,

          type: finance.type === FinanceType.C ? BankingType.D : BankingType.C,
          document: finance.document,
          historic: finance.historic,
          issueDate: DateTime.now(),
          documentValue: finance.value,
          feeValue: finance.feeValue,
          feePercentage: finance.feePercentage,
          discountValue: finance.discountValue,
          discountPercentage: finance.discountPercentage,
          totalValue: finance.paymentValue ?? -1,
          reconciled: true,
          installment: finance.installment,
          originFlag: BankingOriginFlag.F,
          observation: finance.observation,
          status: BankingStatus.B,
          prevBalance: balance,
          balance:
            finance.type === FinanceType.C
              ? balance - (finance.paymentValue ?? 0)
              : balance + (finance.paymentValue ?? 0),

          competenceDate: finance.competenceDate,
          fiscalNote: finance.fiscalNote,
          userDocument: finance.userDocument,
          nsuDocument: finance.nsuDocument,
          barCode: finance.barCode,
        },
        {
          client: trx,
        },
      );

      await FinanceReversal.create(
        {
          type: FinanceReversalType.E,
          downDate: DateTime.now(),
          reversalOrigin: data.originDownFlag,
          reversalReason: data.reason,

          economic_group_id: finance.economic_group_id,
          business_unit_id: finance.business_unit_id,
          finance_id: finance?.id,
          client_id: finance.client_id,
          checking_account_id: finance.checking_account_id ?? undefined,
          account_plan_id: finance.account_plan_id,
          payment_method_id: finance.payment_method_id,
          banking_id: banking.id,

          feeDiscountPercentage: finance.feeDiscountPercentage,
          feeDiscountValue: finance.feeDiscountValue,
          expirationDate: finance.expirationDate,
          paymentDate: finance.paymentDate ?? undefined,
          totalValue: finance.totalValue,
          paymentValue: finance.paymentValue ?? undefined,
          feeValue: finance.feeValue,
          feePercentage: finance.feePercentage,
          discountValue: finance.discountValue,
          discountPercentage: finance.discountPercentage,
          additionPercentage: finance.additionPercentage,
          additionValue: finance.additionValue,

          competenceDate: finance.competenceDate,
          fiscalNote: finance.fiscalNote,
          userDocument: finance.userDocument,
          nsuDocument: finance.nsuDocument,
          barCode: finance.barCode,
          bank: finance.bank,
          agency: finance.agency,
          account: finance.account,
          tef_flag_id: finance.tef_flag_id,
          acquirer_id: finance.acquirer_id,
        },
        {
          client: trx,
        },
      );

      if (checkingAccount) {
        await checkingAccount
          .merge({
            balance:
              finance.type === FinanceType.C
                ? checkingAccount.balance - (finance.paymentValue ?? 0)
                : checkingAccount.balance + (finance.paymentValue ?? 0),
          })
          .useTransaction(trx)
          .save();
      }

      return finance
        .merge({
          checking_account_id: null,
          banking_id: undefined,

          paymentDate: null,
          downDate: null,
          paymentValue: null,
          status: FinanceStatus.A,
          reversalReason: data.reason,
          originDownFlag: undefined,
        })
        .useTransaction(trx)
        .save();
    });
  }

  // 2.3
  async deleteFinance(unitId: string, id: string) {
    const finance = await Finance.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!finance) {
      throw this.sharedService.ResourceNotFound();
    }

    if (finance.status !== FinanceStatus.A) {
      throw new BadRequestException(
        'Não é possível excluir um lançamento que não está ativo',
        400,
        'BAD_REQUEST',
      );
    }

    if (finance.originFlag !== FinanceOriginFlag.F) {
      throw new BadRequestException(
        'Não é possível excluir um lançamento que foi criado pelo financeiro',
        400,
        'BAD_REQUEST',
      );
    }

    return finance
      .merge({
        status: FinanceStatus.E,
      })
      .save();
  }

  async acceptMany(authCtx: AuthContext, data: { ids: string[] }) {
    await Database.transaction(async trx => {
      const finances = await Finance.query()
        .useTransaction(trx)
        .whereIn('id', data.ids)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id);

      if (finances.length !== data.ids.length) {
        throw new BadRequestException(
          'Não foi possível encontrar todos os lançamentos',
          400,
          'BAD_REQUEST',
        );
      }

      await Finance.query()
        .useTransaction(trx)
        .whereIn('id', data.ids)
        .where('economic_group_id', authCtx.group.id)
        .where('business_unit_id', authCtx.unit.id)
        .update({
          accept: FinanceAccept.S,
        });
    });
  }

  async getExpiringExpenses(authCtx: AuthContext) {
    const finances = await Finance.query()
      .where('economic_group_id', authCtx.group.id)
      .where('business_unit_id', authCtx.unit.id)
      .where('type', FinanceType.D)
      .where('status', FinanceStatus.A)
      .whereRaw('expiration_date::date = now()::date', [])
      .whereNull('payment_date')
      .preload('paymentMethod')
      .preload('client', query => {
        query.preload('tutor', query => {
          query.preload('accountPlan');
        });
      });

    const dataSet = new Map<string, { value: number }>();
    finances.forEach(elem => {
      const key = elem?.client_id ?? '__';
      if (!dataSet.has(key)) {
        dataSet.set(key, { value: 0 });
      }

      const entry = dataSet.get(key)!;
      entry.value += elem.value;

      dataSet.set(key, entry);
    });

    return Array.from(dataSet.keys()).map(elem => ({
      supplier:
        finances.find(e => e.client_id === elem)?.client?.name ??
        'Título sem fornecedor',
      value: dataSet.get(elem)?.value ?? 0,
    }));

    // return finances.map(elem => ({
    //   id: elem.id,
    //   document: elem.document,
    //   installment: elem.installment,
    //   paymentMethod: {
    //     id: elem.paymentMethod.id,
    //     description: elem.paymentMethod.description,
    //   },
    //   totalValue: elem.totalValue,
    //   supplier: {
    //     id: elem.client.id,
    //     name: elem.client.name,
    //     accountPlan: this.sharedService.captureGroup(
    //       elem.client?.tutor?.accountPlan,
    //       v => ({
    //         id: v.id,
    //         description: v.description,
    //       }),
    //     ),
    //   },
    // }));
  }

  async getExpiringPayments(authCtx: AuthContext) {
    const today = DateTime.now();

    const finances = await Finance.query()
      .where('economic_group_id', authCtx.group.id)
      .where('business_unit_id', authCtx.unit.id)
      .where('type', FinanceType.C)
      .where('status', FinanceStatus.A)
      .whereBetween('expiration_date', [
        today.startOf('day').toISO() ?? '',
        today.endOf('day').toISO() ?? '',
      ])
      .whereNull('payment_date')
      .preload('paymentMethod')
      .preload('client', query => {
        query.preload('tutor', query => {
          query.preload('accountPlan');
        });
      });

    return finances.map(elem => ({
      id: elem.id,
      document: elem.document,
      installment: elem.installment,
      paymentMethod: {
        id: elem.paymentMethod.id,
        description: elem.paymentMethod.description,
      },
      totalValue: elem.value,
      supplier: {
        id: elem.client.id,
        name: elem.client.name,
        accountPlan: this.sharedService.captureGroup(
          elem.client?.tutor?.accountPlan,
          v => ({
            id: v.id,
            description: v.description,
          }),
        ),
      },
    }));
  }

  async getCheckingAccountsResume(authCtx: AuthContext) {
    const result = await CheckingAccount.query()
      .where('business_unit_id', authCtx.unit.id)
      .where('active', true);

    return result.map(elem => ({
      id: elem.id,
      description: elem.description,
      accountNumber: elem.accountNumber,
      balance: elem.balance,
    }));
  }

  async getOpenDailyCashiers(authCtx: AuthContext) {
    const result = await DailyCashier.query()
      .where('business_unit_id', authCtx.unit.id)
      .where('status', DailyCashierStatus.A)
      .preload('userWhoOpened');

    return result.map(elem => ({
      id: elem.id,
      tag: elem.tag,
      openingBalance: this.parseDecimal(elem.openingBalance),
      cashierFunds: this.parseDecimal(elem.cashierFunds),
      salesTotal: this.parseDecimal(elem.salesTotal),
      receiptsTotal: this.parseDecimal(elem.receiptsTotal),
      cashierTotal: this.parseDecimal(elem.cashierTotal),
      openingDate: elem.openingDate,

      userWhoOpened: {
        id: elem.userWhoOpened.id,
        name: elem.userWhoOpened.name,
      },
    }));
  }

  async getClosedDailyCashiers(authCtx: AuthContext) {
    const result = await DailyCashier.query()
      .where('business_unit_id', authCtx.unit.id)
      .where('status', DailyCashierStatus.F)
      .preload('userWhoClosed');

    return result.map(elem => ({
      id: elem.id,
      tag: elem.tag,
      openingBalance: this.parseDecimal(elem.openingBalance),
      cashierFunds: this.parseDecimal(elem.cashierFunds),
      salesTotal: this.parseDecimal(elem.salesTotal),
      receiptsTotal: this.parseDecimal(elem.receiptsTotal),
      cashierTotal: this.parseDecimal(elem.cashierTotal),
      openingDate: elem.openingDate,
      closingDate: elem.closingDate,

      userWhoClosed: {
        id: elem.userWhoClosed.id,
        name: elem.userWhoClosed.name,
      },
    }));
  }

  async getRevisedDailyCashiers(authCtx: AuthContext) {
    const result = await DailyCashier.query()
      .where('business_unit_id', authCtx.unit.id)
      .where('status', DailyCashierStatus.R)
      .preload('userWhoRevised');

    return result.map(elem => ({
      id: elem.id,
      tag: elem.tag,
      openingBalance: this.parseDecimal(elem.openingBalance),
      cashierFunds: this.parseDecimal(elem.cashierFunds),
      salesTotal: this.parseDecimal(elem.salesTotal),
      receiptsTotal: this.parseDecimal(elem.receiptsTotal),
      cashierTotal: this.parseDecimal(elem.cashierTotal),
      openingDate: elem.openingDate,
      closingDate: elem.closingDate,
      revisionDate: elem.revisionDate,

      userWhoRevised: {
        id: elem.userWhoRevised.id,
        name: elem.userWhoRevised.name,
      },
    }));
  }

  async getTodayDailyCashiers(authCtx: AuthContext) {
    const today = DateTime.now();

    const result = await DailyCashier.query()
      .where('business_unit_id', authCtx.unit.id)
      .whereBetween('opening_date', [
        today.startOf('day').toISO() ?? '',
        today.endOf('day').toISO() ?? '',
      ])
      .preload('userWhoOpened');

    return result.map(elem => ({
      id: elem.id,
      tag: elem.tag,
      openingDate: elem.openingDate,
      closingDate: elem.closingDate,
      revisionDate: elem.revisionDate,

      openingBalance: this.parseDecimal(elem.openingBalance),
      cashierFunds: this.parseDecimal(elem.cashierFunds),
      salesTotal: this.parseDecimal(elem.salesTotal),
      receiptsTotal: this.parseDecimal(elem.receiptsTotal),
      cashierTotal: this.parseDecimal(elem.cashierTotal),

      openingUser: {
        id: elem.userWhoOpened.id,
        name: elem.userWhoOpened.name,
      },
    }));
  }

  async getOverallResume(authCtx: AuthContext) {
    // 1.8.1.1
    const first = await Database.from('finances')
      .where('business_unit_id', authCtx.unit.id)
      .where('type', FinanceType.D)
      .where('status', FinanceStatus.A)
      .whereNull('payment_date')
      .whereRaw('expiration_date::date < now()::date', [])
      .whereNull('deleted_at')
      .sum('value')
      .first();

    // 1.8.1.2
    const second = await Database.from('finances')
      .where('business_unit_id', authCtx.unit.id)
      .where('type', FinanceType.C)
      .where('status', FinanceStatus.A)
      .whereNull('payment_date')
      .whereRaw('expiration_date::date < now()::date', [])
      .whereNull('deleted_at')
      .sum('value')
      .first();

    // 1.8.1.3
    const third = await Database.from('finances')
      .where('business_unit_id', authCtx.unit.id)
      .where('type', FinanceType.D)
      .where('status', FinanceStatus.A)
      .whereNull('payment_date')
      .whereRaw('expiration_date::date >= now()::date', [])
      .whereNull('deleted_at')
      .sum('value')
      .first();

    // 1.8.1.4
    const fourth = await Database.from('finances')
      .where('business_unit_id', authCtx.unit.id)
      .where('type', FinanceType.C)
      .where('status', FinanceStatus.A)
      .whereNull('payment_date')
      .whereRaw('expiration_date::date >= now()::date', [])
      .whereNull('deleted_at')
      .sum('value')
      .first();

    // 1.8.1.5
    const fifth = await Database.from('checking_accounts')
      .where('business_unit_id', authCtx.unit.id)
      .andWhereNull('deleted_at')
      .first();

    return [
      {
        type: 'VencidosAPagar',
        total: first.sum ?? 0,
      },
      {
        type: 'VencidosAReceber',
        total: second.sum ?? 0,
      },
      {
        type: 'FuturosAPagar',
        total: third.sum ?? 0,
      },
      {
        type: 'FuturosAReceber',
        total: fourth.sum ?? 0,
      },
      {
        type: 'ContasCorrentes',
        total: this.parseDecimal(fifth.balance) ?? 0,
      },
    ];
  }

  async getOpenAttendances(authCtx: AuthContext) {
    const result = await Attendance.query()
      .where('business_unit_id', authCtx.unit.id)
      .whereNull('end_date')
      .preload('tutor')
      .preload('patient')
      .preload('openUser')
      .preload('scheduleService')
      .orderBy('start_date', 'desc');

    return result.map(elem => ({
      id: elem.id,
      scheduleId: elem.schedule_id,
      tutor: this.sharedService.captureGroup(elem.tutor, v => ({
        id: v.id,
        name: v.name,
      })),
      patient: this.sharedService.captureGroup(elem.patient, v => ({
        id: v.id,
        name: v.name,
      })),
      openUser: this.sharedService.captureGroup(elem.openUser, v => ({
        id: v.id,
        name: v.name,
      })),
      scheduleService: this.sharedService.captureGroup(
        elem.scheduleService,
        v => ({
          id: v.id,
          description: v.description,
        }),
      ),
    }));
  }

  private parseDecimal(value: string | number) {
    if (!value) return null;

    return parseFloat(value as string);
  }
}
