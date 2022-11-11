import { inject } from '@adonisjs/fold';
import PaymentMethod from 'App/Models/PaymentMethod';
import PaymentMethodFee from 'App/Models/PaymentMethodFee';
import PaymentMethodFlag from 'App/Models/PaymentMethodFlag';
import SharedService from 'App/Services/SharedService';
import {
  ICreatePaymentMethodData,
  ICreatePaymentMethodFeeData,
  ICreatePaymentMethodFlagData,
} from 'Contracts/interfaces/IPaymentMethodData';

interface ISearch {
  description?: string;
  tef?: string;
  type?: string;
}

@inject()
export default class PaymentMethodService {
  constructor(private sharedService: SharedService) {}

  async searchPartialPaymentMethods(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = PaymentMethod.query().where('economic_group_id', group.id);

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.tef) {
      qb.where('tef', data.tef);
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    return qb;
  }

  async searchCompletePaymentMethods(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = PaymentMethod.query().preload('flags').preload('fees');

    qb.where('economic_group_id', group.id);

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.tef) {
      qb.where('tef', data.tef);
    }

    if (data.type) {
      qb.where('type', data.type);
    }

    return qb;
  }

  async createPaymentMethod(unitId: string, data: ICreatePaymentMethodData) {
    const group = await this.sharedService.getUserGroup(unitId);

    return PaymentMethod.create({
      economicGroupId: group.id,
      description: data.description,
      requiresDocument: data.requiresDocument,
      tef: data.tef,
      automaticCancelation: data.automaticCancelation,
      daysFirstInstallment: data.daysFirstInstallment,
      daysBetweenInstallments: data.daysBetweenInstallments,
      allowChangeExpirationDate: data.allowChangeExpirationDate,
      minimumInstallmentValue: data.minimumInstallmentValue,
      type: data.type,
      checkingAccountId: data.checkingAccountId,
      fee: data.fee ?? 0,
      daysUntilTransfer: data.daysUntilTransfer ?? 0,
      installmentsWithoutPassword: data.installmentsWithoutPassword,
      maxInstallments: data.maxInstallments,
    });
  }

  async createPaymentMethodFlag(
    unitId: string,
    data: ICreatePaymentMethodFlagData,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return PaymentMethodFlag.create({
      economic_group_id: group.id,
      payment_method_id: data.paymentMethodId,
      tef_flag_id: data.tefFlagId,
      tef_acquirer_id: data.tefAcquirerId,
      checking_account_id: data.checkingAccountId,
      fee: data.fee ?? 0,
      maxInstallments: data.maxInstallments,
    });
  }

  async createPaymentMethodFee(
    unitId: string,
    data: ICreatePaymentMethodFeeData,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return PaymentMethodFee.create({
      economic_group_id: group.id,
      business_unit_id: unitId,
      payment_method_id: data.paymentMethodId,
      payment_method_flag_id: data.paymentMethodFlagId,
      installments: data.installments,
      fee: data.fee,
    });
  }
}
