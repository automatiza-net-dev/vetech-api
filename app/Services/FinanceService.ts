import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import Banking, {
  BankingOriginFlag,
  BankingStatus,
  BankingType,
} from 'App/Models/Banking';
import CheckingAccount from 'App/Models/CheckingAccount';
import DailyCashier from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import Finance, {
  FinanceOriginFlag,
  FinanceStatus,
  FinanceType,
} from 'App/Models/Finance';
import FinanceReversal, {
  FinanceReversalType,
} from 'App/Models/FinanceReversal';
import PaymentMethod from 'App/Models/PaymentMethod';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
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

    const qb = Finance.query().whereIn('business_unit_id', units);

    if (data.fromIssueDate) {
      qb.where('issue_date', '>=', new Date(data.fromIssueDate));
    }

    if (data.toIssueDate) {
      qb.where('issue_date', '<=', new Date(data.toIssueDate));
    }

    if (data.fromExpirationDate) {
      qb.where('expiration_date', '>=', new Date(data.fromExpirationDate));
    }

    if (data.toExpirationDate) {
      qb.where('expiration_date', '<=', new Date(data.toExpirationDate));
    }

    if (data.fromPaymentDate) {
      qb.where('payment_date', '>=', new Date(data.fromPaymentDate));
    }

    if (data.toPaymentDate) {
      qb.where('payment_date', '<=', new Date(data.toPaymentDate));
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

    qb.preload('client');
    qb.preload('paymentMethod');
    qb.preload('accountPlan');

    return qb;
  }

  // 2.1
  async createFinance(unitId: string, user: User, data: IUpsertFinance) {
    const group = await this.sharedService.getUserGroup(unitId);

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

    const discount = data.originalValue * (paymentMethod.fee / 100);

    return Finance.create({
      daily_movement_id: dailyMovement?.id,
      daily_cashier_id: dailyCashier?.id,
      status: FinanceStatus.A,
      feeDiscountPercentage: paymentMethod.fee,
      feeDiscountValue: discount,
      economic_group_id: group.id,
      business_unit_id: unitId,
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
      checking_account_id: data.checkingAccountId,

      paymentDate: data.paymentDate,
      downDate: data.downDate,
      paymentValue: data.paymentValue,
      feeValue: data.feeValue,
      feePercentage: data.feePercentage,
      discountValue: data.discountValue,
      discountPercentage: data.discountPercentage,
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

        checking_account_id: data.checkingAccountId,
        feeValue: data.feeValue,
        feePercentage: data.feePercentage,
        discountValue: data.discountValue,
        discountPercentage: data.discountPercentage,
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

  // 2.4 ?
  // 2.6 ?
  async updateFinanceDown(unitId: string, id: string, data: IFinanceDownData) {
    const group = await this.sharedService.getUserGroup(unitId);

    const finance = await Finance.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!finance) {
      throw this.sharedService.ResourceNotFound();
    }

    const checkingAccount = await CheckingAccount.findOrFail(
      data.checkingAccountId,
    );

    return Database.transaction(async trx => {
      finance.merge({
        checking_account_id: data.checkingAccountId,
        status: FinanceStatus.B,
        downDate: DateTime.now(),
        paymentValue: data.paymentValue,
        paymentDate: data.paymentDate,
        originDownFlag: data.originDownFlag,

        feeValue: data.feeValue,
        feePercentage: data.feePercentage,
        discountValue: data.discountValue,
        discountPercentage: data.discountPercentage,
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
      });

      const banking = await Banking.create(
        {
          economic_group_id: group.id,
          business_unit_id: unitId,
          client_id: finance.client_id,
          account_plan_id: finance.account_plan_id,
          payment_method_id: finance.payment_method_id,
          checking_account_id: checkingAccount.id,
          daily_movement_id: finance.daily_movement_id,
          daily_cashier_id: finance.daily_cashier_id,

          paymentMethodDiscountValue: finance.feeDiscountValue,
          paymentMethodDiscountPercentage: finance.feeDiscountPercentage,

          type: BankingType[finance.type],
          document: finance.document,
          historic: finance.historic,
          issueDate: finance.issueDate,
          documentValue: finance.value,
          feeValue: finance.feeValue,
          feePercentage: finance.feePercentage,
          discountValue: finance.discountValue,
          discountPercentage: finance.discountPercentage,
          totalValue: finance.totalValue,
          reconciled: true,
          installment: finance.installment,
          originFlag: BankingOriginFlag.F,
          observation: finance.observation,
          status: BankingStatus.B,
          prevBalance: checkingAccount.balance,
          balance: checkingAccount.balance - finance.value,

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
          balance: checkingAccount.balance - finance.value,
        })
        .useTransaction(trx)
        .save();

      await FinanceReversal.create(
        {
          type: FinanceReversalType.B,
          downDate: DateTime.now(),
          reversalOrigin: data.originDownFlag,

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

      return finance
        .merge({
          banking_id: banking.id,
        })
        .useTransaction(trx)
        .save();
    });
  }

  // 2.7
  async updateFinanceReversal(
    unitId: string,
    id: string,
    data: IFinanceReversalData,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

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

    return Database.transaction(async trx => {
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

          paymentMethodDiscountValue: finance.feeDiscountValue,
          paymentMethodDiscountPercentage: finance.feeDiscountPercentage,

          type: finance.type === FinanceType.C ? BankingType.D : BankingType.C,
          document: finance.document,
          historic: finance.historic,
          issueDate: finance.issueDate,
          documentValue: finance.value,
          feeValue: finance.feeValue,
          feePercentage: finance.feePercentage,
          discountValue: finance.discountValue,
          discountPercentage: finance.discountPercentage,
          totalValue: finance.totalValue,
          reconciled: true,
          installment: finance.installment,
          originFlag: BankingOriginFlag.F,
          observation: finance.observation,
          status: BankingStatus.B,
          prevBalance: checkingAccount?.balance ?? 0,
          balance: checkingAccount?.balance ?? 0 + finance.value,

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

      return finance
        .merge({
          checking_account_id: null,
          paymentDate: null,
          downDate: null,
          paymentValue: null,
          status: FinanceStatus.A,
          reversalReason: data.reason,
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
}
