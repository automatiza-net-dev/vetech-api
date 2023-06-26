import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import PaymentMethod from 'App/Models/PaymentMethod';
import AccountPlan from 'App/Models/AccountPlan';

export enum DailyCashierEntryType {
  D = 'DEBITO',
  C = 'CREDITO',
}

export enum DailyCashierEntryStatus {
  A = 'ATIVO',
}

export default class DailyCashierEntry extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column.dateTime({
    columnName: 'entry_date',
  })
  public entryDate: DateTime;

  @column()
  public type: DailyCashierEntryType;

  @column()
  public description: string;

  @column({
    columnName: 'fiscal_note',
  })
  public fiscalNote: string;

  @column({
    serialize: parseFloat,
  })
  public value: number;

  @column()
  public status: DailyCashierEntryStatus;

  @column()
  public tag: number;

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
  public business_unit_id: string;

  @column({
    serializeAs: null,
  })
  public daily_cashier_id: string;

  @column({
    serializeAs: null,
  })
  public payment_method_id: string;

  @belongsTo(() => PaymentMethod, {
    foreignKey: 'payment_method_id',
  })
  public paymentMethod: BelongsTo<typeof PaymentMethod>;

  @column({
    serializeAs: null,
  })
  public account_plan_id: string;

  @belongsTo(() => AccountPlan, {
    foreignKey: 'account_plan_id',
  })
  public accountPlan: BelongsTo<typeof AccountPlan>;
}
