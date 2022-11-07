import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import User from 'App/Models/User';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class DailyCashierLog extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column.dateTime({
    columnName: 'opening_date',
  })
  public openingDate: DateTime;

  @column.dateTime({
    columnName: 'closing_date',
  })
  public closingDate: DateTime;

  @column.dateTime({
    columnName: 'revision_date',
  })
  public revisionDate: DateTime;

  @column.dateTime({
    columnName: 'checking_date',
  })
  public checkingDate: DateTime;

  @column({
    columnName: 'opening_balance',
    serialize: parseFloat,
  })
  public openingBalance: number;

  @column({
    columnName: 'cashier_funds',
    serialize: parseFloat,
  })
  public cashierFunds: number;

  @column({
    columnName: 'sales_total',
    serialize: parseFloat,
  })
  public salesTotal: number;

  @column({
    columnName: 'expenses_total',
    serialize: parseFloat,
  })
  public expensesTotal: number;

  @column({
    columnName: 'receipts_total',
    serialize: parseFloat,
  })
  public receiptsTotal: number;

  @column({
    columnName: 'cashier_total',
    serialize: parseFloat,
  })
  public cashierTotal: number;
  @column({
    columnName: 'cashier_balance',
    serialize: parseFloat,
  })
  public cashierBalance: number;

  @column()
  public observations: string;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

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
  public user_who_reopened_id: string;

  @belongsTo(() => User, {
    foreignKey: 'user_who_reopened_id',
  })
  public userWhoReopened: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public user_who_closed_id: string;

  @belongsTo(() => User, {
    foreignKey: 'user_who_closed_id',
  })
  public userWhoClosed: BelongsTo<typeof User>;
}
