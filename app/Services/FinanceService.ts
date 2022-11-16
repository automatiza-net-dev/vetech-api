import { inject } from '@adonisjs/fold';
import DailyCashier from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import Finance, { FinanceStatus } from 'App/Models/Finance';
import FinanceReversal, {
  FinanceReversalType,
} from 'App/Models/FinanceReversal';
import PaymentMethod from 'App/Models/PaymentMethod';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import {
  IFinanceDownData,
  IFinanceReversalData,
  IUpsertFinance,
} from 'Contracts/interfaces/IFinanceData';
import { DateTime } from 'luxon';

@inject()
export default class FinanceService {
  constructor(private sharedService: SharedService) {}

  async index(unitId: string) {
    const qb = Finance.query().where('business_unit_id', unitId);

    return qb;
  }

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
    });
  }

  async updateFinance(
    unitId: string,
    user: User,
    id: string,
    data: IUpsertFinance,
  ) {
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

    const finance = await Finance.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!finance) {
      throw this.sharedService.ResourceNotFound();
    }

    return finance
      .merge({
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
      })
      .save();
  }

  async updateFinanceDown(unitId: string, id: string, data: IFinanceDownData) {
    const finance = await Finance.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!finance) {
      throw this.sharedService.ResourceNotFound();
    }

    await FinanceReversal.create({
      type: FinanceReversalType.B,
      downDate: DateTime.now(),
      reversalOrigin: data.originDownFlag,

      economic_group_id: finance.economic_group_id,
      business_unit_id: finance.business_unit_id,
      finance_id: finance.id,
      client_id: finance.client_id,
      checking_account_id: finance.checking_account_id,
      account_plan_id: finance.account_plan_id,
      payment_method_id: finance.payment_method_id,

      feeDiscountPercentage: finance.feeDiscountPercentage,
      feeDiscountValue: finance.feeDiscountValue,
      expirationDate: finance.expirationDate,
      paymentDate: finance.paymentDate,
      totalValue: finance.totalValue,
      paymentValue: finance.paymentValue,
      feeValue: finance.feeValue,
      feePercentage: finance.feePercentage,
      discountValue: finance.discountValue,
      discountPercentage: finance.discountPercentage,
      additionPercentage: finance.additionPercentage,
      additionValue: finance.additionValue,
    });

    return finance
      .merge({
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
      })
      .save();
  }

  async updateFinanceReversal(
    unitId: string,
    id: string,
    data: IFinanceReversalData,
  ) {
    const finance = await Finance.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!finance) {
      throw this.sharedService.ResourceNotFound();
    }

    await FinanceReversal.create({
      type: FinanceReversalType.E,
      downDate: DateTime.now(),
      reversalOrigin: data.originDownFlag,

      economic_group_id: finance.economic_group_id,
      business_unit_id: finance.business_unit_id,
      finance_id: finance.id,
      client_id: finance.client_id,
      checking_account_id: finance.checking_account_id,
      account_plan_id: finance.account_plan_id,
      payment_method_id: finance.payment_method_id,

      feeDiscountPercentage: finance.feeDiscountPercentage,
      feeDiscountValue: finance.feeDiscountValue,
      expirationDate: finance.expirationDate,
      paymentDate: finance.paymentDate,
      totalValue: finance.totalValue,
      paymentValue: finance.paymentValue,
      feeValue: finance.feeValue,
      feePercentage: finance.feePercentage,
      discountValue: finance.discountValue,
      discountPercentage: finance.discountPercentage,
      additionPercentage: finance.additionPercentage,
      additionValue: finance.additionValue,
    });

    return finance
      .merge({
        checking_account_id: undefined,
        paymentDate: undefined,
        downDate: undefined,
        paymentValue: undefined,
        status: FinanceStatus.A,
        reversalReason: data.reason,
      })
      .save();
  }
}
