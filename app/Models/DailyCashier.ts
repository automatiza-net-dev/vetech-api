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
import Bill from 'App/Models/Bill';
import BusinessUnit from 'App/Models/BusinessUnit';
import DailyCashierEntry from 'App/Models/DailyCashierEntry';
import DailyCashierLog from 'App/Models/DailyCashierLog';
import DailyMovement from 'App/Models/DailyMovement';
import User from 'App/Models/User';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import BillPayment from './BillPayment';

export enum DailyCashierStatus {
  A = 'ABERTO',
  F = 'FECHADO',
  R = 'REVISAO',
  C = 'CONFERIDO',
}

export default class DailyCashier extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column.dateTime({
    columnName: 'opening_date',
  })
  public openingDate: DateTime;

  @column.dateTime({
    columnName: 'closing_date',
  })
  public closingDate: DateTime | null;

  @column.dateTime({
    columnName: 'revision_date',
  })
  public revisionDate: DateTime | null;

  @column.dateTime({
    columnName: 'checking_date',
  })
  public checkingDate: DateTime | null;

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

  @column()
  public status: DailyCashierStatus;

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

  @belongsTo(() => BusinessUnit, {
    foreignKey: 'business_unit_id',
  })
  public businessUnit: BelongsTo<typeof BusinessUnit>;

  @column({
    serializeAs: null,
  })
  public daily_movement_id: string;

  @belongsTo(() => DailyMovement, {
    foreignKey: 'daily_movement_id',
  })
  public dailyMovement: BelongsTo<typeof DailyMovement>;

  @column({
    serializeAs: null,
  })
  public user_who_opened_id: string;

  @belongsTo(() => User, {
    foreignKey: 'user_who_opened_id',
  })
  public userWhoOpened: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public user_who_closed_id: string | null;

  @belongsTo(() => User, {
    foreignKey: 'user_who_closed_id',
  })
  public userWhoClosed: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public user_who_checked_id: string | null;

  @belongsTo(() => User, {
    foreignKey: 'user_who_checked_id',
  })
  public userWhoChecked: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public user_who_revised_id: string | null;

  @belongsTo(() => User, {
    foreignKey: 'user_who_revised_id',
  })
  public userWhoRevised: BelongsTo<typeof User>;

  @hasMany(() => DailyCashierLog, {
    foreignKey: 'daily_cashier_id',
  })
  public logs: HasMany<typeof DailyCashierLog>;

  @hasMany(() => DailyCashierEntry, {
    foreignKey: 'daily_cashier_id',
  })
  public entries: HasMany<typeof DailyCashierEntry>;

  @hasMany(() => Bill, {
    foreignKey: 'daily_cashier_id',
  })
  public bills: HasMany<typeof Bill>;

  @hasMany(() => BillPayment, {
    foreignKey: 'daily_cashier_id',
  })
  public billPayments: HasMany<typeof BillPayment>;
}
