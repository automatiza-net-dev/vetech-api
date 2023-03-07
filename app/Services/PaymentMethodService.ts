import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import PaymentMethod from 'App/Models/PaymentMethod';
import PaymentMethodFee from 'App/Models/PaymentMethodFee';
import PaymentMethodFlag from 'App/Models/PaymentMethodFlag';
import PaymentMethodFlagInstallment from 'App/Models/PaymentMethodFlagInstallment';
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
        query.preload('installments');
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

  async createPaymentMethod(
    unitId: string,
    data: Omit<ICreatePaymentMethodData, 'active'>,
  ) {
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
  async updatePaymentMethod(
    unitId: string,
    id: string,
    data: ICreatePaymentMethodData,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    const paymentMethod = await PaymentMethod.query()
      .where('economic_group_id', group.id)
      .where('id', id)
      .first();
    if (!paymentMethod) {
      throw this.sharedService.ResourceNotFound();
    }

    return paymentMethod
      .merge({
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
        active: data.active,
      })
      .save();
  }

  async createPaymentMethodFlag(
    unitId: string,
    data: ICreatePaymentMethodFlagData,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const existingFlag = await PaymentMethodFlag.query()
        .useTransaction(trx)
        .where('economic_group_id', group.id)
        .where('tef_flag_id', data.tefFlagId)
        .first();

      if (existingFlag) {
        throw new BadRequestException(
          'Não é possível ter uma mesma bandeira duas vezes',
          400,
          'E_ERR',
        );
      }

      const flag = await PaymentMethodFlag.create(
        {
          economic_group_id: group.id,
          payment_method_id: data.paymentMethodId,
          tef_flag_id: data.tefFlagId,
          tef_acquirer_id: data.tefAcquirerId,
          checking_account_id: data.checkingAccountId,
          maxInstallments: data.maxInstallments,
        },
        {
          client: trx,
        },
      );

      await flag.related('installments').createMany(
        Array.from({ length: data.maxInstallments ?? 0 }, (_, k) => ({
          installment: k + 1,
          fee: 0,
        })),
        {
          client: trx,
        },
      );

      return flag;
    });
  }

  async updatePaymentMethodFlag(
    unitId: string,
    id: string,
    data: IUpdatePaymentMethodFlagData,
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const flag = await PaymentMethodFlag.query()
        .useTransaction(trx)
        .where('economic_group_id', group.id)
        .where('id', id)
        .preload('installments')
        .first();

      if (!flag) {
        throw this.sharedService.ResourceNotFound();
      }

      const updatedFlag = await flag
        .merge({
          economic_group_id: group.id,
          tef_acquirer_id: data.tefAcquirerId,
          maxInstallments: data.maxInstallments,
          active: data.active,
        })
        .useTransaction(trx)
        .save();

      if (updatedFlag.maxInstallments > flag.installments.length) {
        await flag.related('installments').createMany(
          Array.from(
            {
              length:
                (updatedFlag.maxInstallments ?? 0) -
                updatedFlag.installments.length,
            },
            (_, k) => ({
              installment: updatedFlag.installments.length + k + 1,
              fee: 0,
            }),
          ),
          {
            client: trx,
          },
        );
      }

      if (updatedFlag.maxInstallments < flag.installments.length) {
        await Promise.all(
          flag.installments
            .filter(i => i.installment > (updatedFlag.maxInstallments ?? 0))
            .map(async installment => {
              return installment.useTransaction(trx).delete();
            }),
        );
      }

      return updatedFlag;
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

  async updatePaymentMethodFlagInstallment(
    unitId: string,
    id: number,
    data: { fee: number },
  ) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const installment = await PaymentMethodFlagInstallment.query()
        .useTransaction(trx)
        .where('id', id)
        .preload('flag')
        .first();

      if (!installment || installment.flag.economic_group_id !== group.id) {
        throw this.sharedService.ResourceNotFound();
      }

      return installment
        .merge({
          fee: data.fee,
        })
        .useTransaction(trx)
        .save();
    });
  }
}
