import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import { DateTime } from 'luxon';

export default class Attendance extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public resume: string;

  @column()
  public protocol: string;

  @column.dateTime()
  public startDate: DateTime;

  @column.dateTime()
  public endDate: DateTime;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public business_unit_id: string;

  @column({
    serializeAs: null,
  })
  public schedule_service_id: string;

  @belongsTo(() => ScheduleServiceType, {
    foreignKey: 'schedule_service_id',
  })
  public scheduleService: BelongsTo<typeof ScheduleServiceType>;

  @column({
    serializeAs: null,
  })
  public service_id: string;

  @column({
    serializeAs: null,
  })
  public schedule_id: string;

  @column({
    serializeAs: null,
  })
  public open_user_id: string;

  @column({
    serializeAs: null,
  })
  public close_user_id: string;

  @column({
    serializeAs: null,
  })
  public tutor_id: string;

  @column({
    serializeAs: null,
  })
  public patient_id: string;
}
