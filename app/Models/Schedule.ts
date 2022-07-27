import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import Patient from 'App/Models/Patient';
import Race from 'App/Models/Race';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import ScheduleStatus from 'App/Models/ScheduleStatus';
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

  @column({
    columnName: 'major_complaint',
  })
  public majorComplaint?: string;

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

  @belongsTo(() => ScheduleServiceType)
  public serviceType: BelongsTo<typeof ScheduleServiceType>;

  @column()
  public schedule_status_id: string;

  @belongsTo(() => ScheduleStatus)
  public serviceStatus: BelongsTo<typeof ScheduleStatus>;

  @column()
  public race_id?: string;

  @belongsTo(() => Race)
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

  @belongsTo(() => Patient)
  public patient: BelongsTo<typeof Patient>;
}
