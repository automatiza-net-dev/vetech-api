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
import Patient from 'App/Models/Patient';
import Schedule from 'App/Models/Schedule';
import User from 'App/Models/User';
import Vaccine from 'App/Models/Vaccine';
import VaccineCalendar from 'App/Models/VaccineCalendar';
import VaccineProtocol from 'App/Models/VaccineProtocol';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class PatientVaccine extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

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
  public vaccine_id: string;

  @belongsTo(() => Vaccine, {
    foreignKey: 'vaccine_id',
  })
  public vaccine: BelongsTo<typeof Vaccine>;

  @column({
    serializeAs: null,
  })
  public vaccine_protocol_id: string;

  @belongsTo(() => VaccineProtocol, {
    foreignKey: 'vaccine_protocol_id',
  })
  public protocol: BelongsTo<typeof VaccineProtocol>;

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

  @column({
    serializeAs: null,
  })
  public business_unit_id: string;

  @hasMany(() => VaccineCalendar, {
    foreignKey: 'patient_vaccine_id',
  })
  public calendars: HasMany<typeof VaccineCalendar>;
}
