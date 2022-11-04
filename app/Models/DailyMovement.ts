import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import User from 'App/Models/User';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum DailyMovementStatus {
  'A' = 'Aberto',
  'C' = 'Conferido',
  'F' = 'Fechado',
}

export default class DailyMovement extends BaseModel {
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
    columnName: 'checking_date',
  })
  public checkingDate: DateTime | null;

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

  @column()
  public observations: string;

  @column()
  public status: DailyMovementStatus;

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
  public user_who_opened_id: string | null;

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
}
