import { inject } from '@adonisjs/fold';
import PaymentMethod from 'App/Models/PaymentMethod';
import SharedService from 'App/Services/SharedService';
import { ICreatePaymentMethodData } from 'Contracts/interfaces/IPaymentMethodData';

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
      daysUntilTransfer: data.daysUntilTransfer,
      installmentsWithoutPassword: data.installmentsWithoutPassword,
      maxInstallments: data.maxInstallments,
    });
  }
}
