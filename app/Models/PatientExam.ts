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
import Exam from 'App/Models/Exam';
import Patient from 'App/Models/Patient';
import PatientExamAttachment from 'App/Models/PatientExamAttachment';
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

  @column.dateTime({
    columnName: 'result_date',
  })
  public resultDate: DateTime;

  @column.dateTime({
    columnName: 'executed_at',
  })
  public executedAt: DateTime;

  @column.dateTime({
    columnName: 'released_at',
  })
  public releasedAt: DateTime;

  @column()
  public status: string;

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

  @column({
    serializeAs: null,
  })
  public exam_id: string;

  @belongsTo(() => Exam, {
    foreignKey: 'exam_id',
  })
  public exam: BelongsTo<typeof Exam>;

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
  public schedule_id: string;

  @belongsTo(() => Schedule, {
    foreignKey: 'schedule_id',
  })
  public schedule: BelongsTo<typeof Schedule>;

  @hasMany(() => PatientExamAttachment, {
    foreignKey: 'patient_exam_id',
  })
  public attachments: HasMany<typeof PatientExamAttachment>;

  @column({
    serializeAs: null,
  })
  public solicitor_id: string;

  @belongsTo(() => User, {
    foreignKey: 'solicitor_id',
  })
  public solicitor: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public executioner_id: string;

  @belongsTo(() => User, {
    foreignKey: 'executioner_id',
  })
  public executor: BelongsTo<typeof User>;
}
