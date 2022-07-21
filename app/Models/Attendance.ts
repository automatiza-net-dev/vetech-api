import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import AttendanceStatus from 'App/Models/AttendanceStatus';
import BusinessUnit from 'App/Models/BusinessUnit';
import Schedule from 'App/Models/Schedule';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class Attendance extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public complaint: string;

  @column({
    columnName: 'start_date',
  })
  public startDate: Date;

  @column({
    columnName: 'end_date',
  })
  public endDate: Date;

  @column({
    columnName: 'clinical_examination',
  })
  public clinicalExamination: string;

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
  public schedule_id: string;

  @belongsTo(() => Schedule)
  public schedule: BelongsTo<typeof Schedule>;

  @column()
  public attendance_status_id: string;

  @belongsTo(() => AttendanceStatus)
  public status: BelongsTo<typeof AttendanceStatus>;

  @column()
  public business_unit_id: string;

  @belongsTo(() => BusinessUnit)
  public businessUnit: BelongsTo<typeof BusinessUnit>;
}
