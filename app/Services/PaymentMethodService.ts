import { inject } from '@adonisjs/fold';
import PaymentMethod from 'App/Models/PaymentMethod';
import PaymentMethodFlag from 'App/Models/PaymentMethodFlag';
import SharedService from 'App/Services/SharedService';
import {
  ICreatePaymentMethodData,
  ICreatePaymentMethodFlagData,
} from 'Contracts/interfaces/IPaymentMethodData';

@inject()
export default class PaymentMethodService {
  constructor(private sharedService: SharedService) {}

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
      tef_flag_id: data.paymentMethodFlagId,
      tef_acquirer_id: data.paymentMethodAcquirerId,
      checking_account_id: data.checkingAccountId,
      fee: data.fee ?? 0,
      maxInstallments: data.maxInstallments,
    });
  }
}
