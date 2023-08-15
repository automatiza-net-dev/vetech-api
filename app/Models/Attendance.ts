import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import Patient from './Patient';
import User from './User';

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

  @belongsTo(() => User, {
    foreignKey: 'open_user_id',
  })
  public openUser: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public close_user_id: string;

  @column({
    serializeAs: null,
  })
  public exclusion_user_id: string;

  @column({
    serializeAs: null,
  })
  public tutor_id: string;

  @belongsTo(() => Patient, {
    foreignKey: 'tutor_id',
  })
  public tutor: BelongsTo<typeof Patient>;

  @column({
    serializeAs: null,
  })
  public patient_id: string;

  @belongsTo(() => Patient, {
    foreignKey: 'patient_id',
  })
  public patient: BelongsTo<typeof Patient>;
}
