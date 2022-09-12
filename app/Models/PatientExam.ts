import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import Exam from 'App/Models/Exam';
import Patient from 'App/Models/Patient';
import Schedule from 'App/Models/Schedule';
import User from 'App/Models/User';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class PatientExam extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column({
    columnName: 'realized_at',
  })
  public realizedAt: DateTime = DateTime.now();

  @column()
  public laboratory: string;

  @column()
  public report: string;

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
  public business_id: string;

  @column()
  public exam_id: string;

  @belongsTo(() => Exam, {
    foreignKey: 'exam_id',
  })
  public exam: BelongsTo<typeof Exam>;

  @column()
  public patient_id: string;

  @belongsTo(() => Patient, {
    foreignKey: 'patient_id',
  })
  public patient: BelongsTo<typeof Patient>;

  @column()
  public user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  public user: BelongsTo<typeof User>;

  @column()
  public schedule_id: string;

  @belongsTo(() => Schedule, {
    foreignKey: 'schedule_id',
  })
  public schedule: BelongsTo<typeof Schedule>;
}
