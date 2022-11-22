import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm';
import PaymentMethod from 'App/Models/PaymentMethod';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum CheckingAccountOperation {
  C = 'CREDITO',
  D = 'DEBITO',
}

export enum CheckingAccountType {
  CC = 'CONTA_CORRENTE',
  CP = 'CONTA_POUPANCA',
  CI = 'CONTA_INVESTIMENTO',
  CX = 'CONTA_CAIXA_UNIDADE_NEGOCIO',
}

export default class CheckingAccount extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public description: string;

  @column({
    columnName: 'account_number',
  })
  public accountNumber: string;

  @column({
    columnName: 'bank_code',
  })
  public bankCode: string;

  @column({
    columnName: 'bank_name',
  })
  public bankName: string;

  @column()
  public agency: string;

  @column({
    columnName: 'agency_phone',
  })
  public agencyPhone: string;

  @column({
    columnName: 'manager_name',
  })
  public managerName: string;

  @column({
    columnName: 'manager_phone',
  })
  public managerPhone: string;

  @column({
    columnName: 'manager_email',
  })
  public managerEmail: string;

  @column({
    serialize: parseFloat,
    consume: parseFloat,
  })
  public limit: number;

  @column({
    serialize: parseFloat,
    consume: parseFloat,
  })
  public balance: number;

  @column()
  public type: CheckingAccountType;

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
    serializeAs: null,
  })
  public economic_group_id: string;

  @column({
    serializeAs: null,
  })
  public business_unit_id: string;

  @hasMany(() => PaymentMethod, {
    foreignKey: 'checking_account_id',
  })
  public paymentMethods: HasMany<typeof PaymentMethod>;
}
