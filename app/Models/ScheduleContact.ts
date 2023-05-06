import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import ScheduleStatus from 'App/Models/ScheduleStatus';
import User from 'App/Models/User';
import { DateTime } from 'luxon';

export default class ScheduleContact extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public observation: string;

  @column.dateTime({
    columnName: 'contact_date',
  })
  public contactDate: DateTime;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public schedule_id: string;

  @column({
    serializeAs: null,
  })
  public schedule_status_id: string;

  @belongsTo(() => ScheduleStatus, {
    foreignKey: 'schedule_status_id',
  })
  public status: BelongsTo<typeof ScheduleStatus>;

  @column({
    serializeAs: null,
  })
  public user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  public user: BelongsTo<typeof User>;
}
