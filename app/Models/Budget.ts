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
import BudgetItem from 'App/Models/BudgetItem';
import DailyCashier from 'App/Models/DailyCashier';
import DailyMovement from 'App/Models/DailyMovement';
import Patient from 'App/Models/Patient';
import Reason from 'App/Models/Reason';
import User from 'App/Models/User';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum BudgetStatus {
  A = 'ABERTO',
  C = 'CONFIRMADO',
  N = 'NAO_CONFIRMADO__CANCELADO',
  P = 'CONFIRMADO_PARCIAL',
}

export default class Budget extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column.dateTime({
    columnName: 'budget_date',
  })
  public budgetDate: DateTime;

  @column.dateTime({
    columnName: 'expiration_date',
  })
  public expirationDate: DateTime;

  @column({
    columnName: 'product_value',
  })
  public productValue: number;

  @column({
    columnName: 'service_value',
  })
  public serviceValue: number;

  @column({
    columnName: 'discount_value',
  })
  public discountValue: number;

  @column({
    columnName: 'total_value',
  })
  public totalValue: number;

  @column()
  public observation: string;

  @column.dateTime({
    columnName: 'finished_at',
  })
  public finishedAt: DateTime;

  @column({
    columnName: 'canceled_observation',
  })
  public canceledObservation: string;

  @column()
  public status: BudgetStatus;

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

  @column({
    serializeAs: null,
  })
  public client_id: string;

  @belongsTo(() => Patient, {
    foreignKey: 'client_id',
  })
  public client: BelongsTo<typeof Patient>;

  @column({
    serializeAs: null,
  })
  public patient_id: string;

  @belongsTo(() => Patient, {
    foreignKey: 'patient_id',
  })
  public patient: BelongsTo<typeof Patient>;

  @column({
    serializeAs: null,
  })
  public user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  public user: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public seller_id: string;

  @belongsTo(() => User, {
    foreignKey: 'seller_id',
  })
  public seller: BelongsTo<typeof User>;

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
  public daily_cashier_id: string;

  @belongsTo(() => DailyCashier, {
    foreignKey: 'daily_cashier_id',
  })
  public dailyCashier: BelongsTo<typeof DailyCashier>;

  @column({
    serializeAs: null,
  })
  public conclusion_user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'conclusion_user_id',
  })
  public conclusionUser: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public cancelation_reason_id: string;

  @belongsTo(() => Reason, {
    foreignKey: 'cancelation_reason_id',
  })
  public cancelationReason: BelongsTo<typeof Reason>;

  @hasMany(() => BudgetItem, {
    foreignKey: 'budget_id',
  })
  public items: HasMany<typeof BudgetItem>;
}
