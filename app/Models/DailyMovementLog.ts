import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import DailyMovement from 'App/Models/DailyMovement';
import User from 'App/Models/User';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class DailyMovementLog extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column.dateTime({
    columnName: 'reopening_date',
  })
  public reopeningDate: DateTime;

  @column.dateTime({
    columnName: 'closing_date',
  })
  public closingDate: DateTime;

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

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column({
    serializeAs: null,
  })
  public daily_movement_id: string;

  @column({
    serializeAs: null,
  })
  public user_who_reopened_id: string;

  @column({
    serializeAs: null,
  })
  public user_who_closed_id: string;

  @belongsTo(() => DailyMovement, {
    foreignKey: 'daily_movement_id',
  })
  public dailyMovement: BelongsTo<typeof DailyMovement>;

  @belongsTo(() => User, {
    foreignKey: 'user_who_reopened_id',
  })
  public userWhoReopened: BelongsTo<typeof User>;

  @belongsTo(() => User, {
    foreignKey: 'user_who_closed_id',
  })
  public userWhoClosed: BelongsTo<typeof User>;
}
