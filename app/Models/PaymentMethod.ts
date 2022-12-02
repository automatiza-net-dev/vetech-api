import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm';
import CheckingAccount from 'App/Models/CheckingAccount';
import PaymentMethodFee from 'App/Models/PaymentMethodFee';
import PaymentMethodFlag from 'App/Models/PaymentMethodFlag';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum PaymentMethodTef {
  N = 'NAO',
  T = 'TEF',
  P = 'POS',
}

export enum PaymentMethodType {
  C = 'CREDITO',
  D = 'DEBITO',
}

export default class PaymentMethod extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

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
  public fee: number;

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

  @column.dateTime({ serializeAs: null })
  public deletedAt: DateTime;

  @beforeFind()
  public static softDeletesFind = softDeleteQuery;

  @beforeFetch()
  public static softDeletesFetch = softDeleteQuery;

  public async softDelete(column?: string) {
    await softDelete(this, column);
  }

  @column({
    columnName: 'economic_group_id',
    serializeAs: null,
  })
  public economicGroupId: string;

  @column({
    columnName: 'checking_account_id',
    serializeAs: null,
  })
  public checkingAccountId: string;

  @belongsTo(() => CheckingAccount, {
    foreignKey: 'checkingAccountId',
  })
  public checkingAccount: BelongsTo<typeof CheckingAccount>;

  @hasMany(() => PaymentMethodFlag, {
    foreignKey: 'payment_method_id',
  })
  public flags: HasMany<typeof PaymentMethodFlag>;

  @hasMany(() => PaymentMethodFee, {
    foreignKey: 'payment_method_id',
  })
  public fees: HasMany<typeof PaymentMethodFee>;
}
