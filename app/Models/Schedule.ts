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
import Attendance from 'App/Models/Attendance';
import BusinessUnit from 'App/Models/BusinessUnit';
import Patient from 'App/Models/Patient';
import Race from 'App/Models/Race';
import Reason from 'App/Models/Reason';
import Rescheduling from 'App/Models/Rescheduling';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import ScheduleStatus from 'App/Models/ScheduleStatus';
import ScheduleStatusChange from 'App/Models/ScheduleStatusChange';
import User from 'App/Models/User';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class Schedule extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column({
    columnName: 'patient_name',
  })
  public patientName?: string;

  @column({
    columnName: 'patient_phone',
  })
  public patientPhone?: string;

  @column.dateTime({
    columnName: 'start_hour',
  })
  public startHour: DateTime;

  @column.dateTime({
    columnName: 'end_hour',
  })
  public endHour: DateTime;

  @column()
  public age?: number;

  @column()
  public observation?: string;

  @column({
    columnName: 'major_complaint',
  })
  public majorComplaint?: string;

  @column({
    columnName: 'on_duty',
  })
  public onDuty?: boolean;

  @column.dateTime({
    columnName: 'finished_at',
  })
  public finishedAt?: DateTime;

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

  @column()
  public business_unit_id: string;

  @belongsTo(() => BusinessUnit)
  public businessUnit: BelongsTo<typeof BusinessUnit>;

  @column()
  public schedule_service_type_id: string;

  @belongsTo(() => ScheduleServiceType, {
    localKey: 'id',
    foreignKey: 'schedule_service_type_id',
  })
  public serviceType: BelongsTo<typeof ScheduleServiceType>;

  @column()
  public schedule_status_id: string;

  @belongsTo(() => ScheduleStatus, {
    localKey: 'id',
    foreignKey: 'schedule_status_id',
  })
  public serviceStatus: BelongsTo<typeof ScheduleStatus>;

  @column()
  public race_id?: string;

  @belongsTo(() => Race, {
    localKey: 'id',
    foreignKey: 'race_id',
  })
  public race: BelongsTo<typeof Race>;

  @column()
  public user_id?: string;

  @belongsTo(() => User, {
    localKey: 'id',
    foreignKey: 'user_id',
  })
  public user: BelongsTo<typeof User>;

  @column()
  public patient_id?: string;

  @belongsTo(() => Patient, {
    localKey: 'id',
    foreignKey: 'patient_id',
  })
  public patient: BelongsTo<typeof Patient>;

  @hasMany(() => Attendance, {
    localKey: 'id',
    foreignKey: 'schedule_id',
  })
  public attendances: HasMany<typeof Attendance>;

  @column()
  public holder_id?: string;

  @belongsTo(() => Patient, {
    localKey: 'id',
    foreignKey: 'holder_id',
  })
  public holder: BelongsTo<typeof Patient>;

  @hasMany(() => Rescheduling, {
    localKey: 'id',
    foreignKey: 'schedule_id',
  })
  public reschedules: HasMany<typeof Rescheduling>;

  @column({
    columnName: 'schedule_origin_id',
    serializeAs: null,
  })
  public scheduleOriginId?: string;

  @belongsTo(() => Schedule, {
    localKey: 'scheduleOriginId',
    foreignKey: 'id',
  })
  // eslint-disable-next-line no-use-before-define
  public scheduleOrigin: BelongsTo<typeof Schedule>;

  @column({
    columnName: 'schedule_return_id',
    serializeAs: null,
  })
  public scheduleReturnId?: string;

  @belongsTo(() => Schedule, {
    localKey: 'scheduleReturnId',
    foreignKey: 'id',
  })
  // eslint-disable-next-line no-use-before-define
  public scheduleReturn: BelongsTo<typeof Schedule>;

  @hasMany(() => ScheduleStatusChange, {
    localKey: 'id',
    foreignKey: 'schedule_id',
  })
  public statusChanges: HasMany<typeof ScheduleStatusChange>;

  @column({
    serializeAs: null,
  })
  public reason_id: string;

  @belongsTo(() => Reason, {
    localKey: 'id',
    foreignKey: 'reason_id',
  })
  public reason: BelongsTo<typeof Reason>;
}
