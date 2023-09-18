import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import {
  PaymentMethodTef,
  PaymentMethodType,
  PaymentMethodUsage,
} from './PaymentMethod';

export default class SystemPaymentMethod extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public description: string;

  @column({
    columnName: 'requires_document',
  })
  public requiresDocument: boolean;

  @column()
  public tef: PaymentMethodTef;

  @column()
  public type: PaymentMethodType;

  @column()
  public usage: PaymentMethodUsage;

  @column()
  public fee: number;

  @column({
    columnName: 'nfe_code',
  })
  public nfe_code: string;

  @column({
    columnName: 'automatic_cancellation',
  })
  public automaticCancellation: boolean;

  @column({
    columnName: 'days_first_installment',
  })
  public daysFirstInstallment: number;

  @column({
    columnName: 'days_between_installments',
  })
  public daysBetweenInstallments: number;

  @column({
    columnName: 'days_until_transfer',
  })
  public daysUntilTransfer: number;

  @column({
    columnName: 'installments_without_password',
  })
  public installmentsWithoutPassword: number;

  @column({
    columnName: 'max_installments',
  })
  public maxInstallments: number;

  @column({
    columnName: 'allow_change_expiration_date',
  })
  public allowChangeExpirationDate: boolean;

  @column({
    columnName: 'minimum_installment_value',
  })
  public minimumInstallmentValue: number;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public system_id: number;

  @column({
    serializeAs: null,
  })
  public checking_account_id: string;
}
