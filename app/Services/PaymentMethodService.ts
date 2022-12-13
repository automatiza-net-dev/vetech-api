import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import PaymentMethod from 'App/Models/PaymentMethod';
import PaymentMethodFee from 'App/Models/PaymentMethodFee';
import PaymentMethodFlag from 'App/Models/PaymentMethodFlag';
import TefAcquirer from 'App/Models/TefAcquirer';
import TefFlag from 'App/Models/TefFlag';
import SharedService from 'App/Services/SharedService';
import {
  ICreatePaymentMethodData,
  ICreatePaymentMethodFeeData,
  ICreatePaymentMethodFlagData,
  IUpdatePaymentMethodFlagData,
} from 'Contracts/interfaces/IPaymentMethodData';

interface ISearchPaymentMethods {
  description?: string;
  tef?: string;
  type?: string;
}

interface ISearchCompletePaymentMethods extends ISearchPaymentMethods {
  active?: string;
  cancellation?: string;
  account?: string;
}

interface ISearchTefFlags {
  type?: string;
}

@inject()
export default class PaymentMethodService {
  constructor(private sharedService: SharedService) {}

  async searchPartialPaymentMethods(
    unitId: string,
    data: ISearchPaymentMethods,
  ) {
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

  async searchCompletePaymentMethods(
    unitId: string,
    data: ISearchCompletePaymentMethods,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = PaymentMethod.query()
      .preload('flags', query => {
        query.preload('acquirer', query => {
          query.select('id', 'description');
        });
        query.preload('flag', query => {
          query.select('id', 'description', 'code', 'type');
        });
      })
      .preload('fees')
      .preload('checkingAccount');

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

    if (data.active) {
      qb.where('active', data.active === 'true');
    }

    if (data.cancellation) {
      qb.where('automatic_cancellation', data.cancellation === 'true');
    }

    if (data.account) {
      qb.whereHas('checkingAccount', query => {
        query.where('type', data.account as string);
      });
    }

    return qb;
  }

  async searchTefFlags(unitId: string, data: ISearchTefFlags) {
    if (!data.type) {
      throw new BadRequestException(
        'Informe o tipo de TEF',
        400,
        'E_MISSING_PARAMETER',
      );
    }

    const group = await this.sharedService.getUserGroup(unitId);

    const qb = TefFlag.query();

    qb.whereRaw('(economic_group_id = ? or economic_group_id is null)', [
      group.id,
    ]);

    qb.where('type', data.type);

    return qb;
  }

  async searchTefAcquirers(unitId: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = TefAcquirer.query();

    qb.whereRaw('(economic_group_id = ? or economic_group_id is null)', [
      group.id,
    ]);

    return qb;
  }

  async createPaymentMethod(unitId: string, data: ICreatePaymentMethodData) {
    const group = await this.sharedService.getUserGroup(unitId);

    return PaymentMethod.create({
      economicGroupId: group.id,
      description: data.description,
      requiresDocument: data.requiresDocument,
      tef: data.tef,
      automaticCancellation: data.automaticCancellation,
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

  async updatePaymentMethodFlag(
    unitId: string,
    id: string,
    data: IUpdatePaymentMethodFlagData,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    const flag = await PaymentMethodFlag.query()
      .where('economic_group_id', group.id)
      .where('id', id)
      .first();

    if (!flag) {
      throw this.sharedService.ResourceNotFound();
    }

    return flag
      .merge({
        economic_group_id: group.id,
        tef_acquirer_id: data.tefAcquirerId,
        fee: data.fee ?? 0,
        maxInstallments: data.maxInstallments,
        active: data.active,
      })
      .save();
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
