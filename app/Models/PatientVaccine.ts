import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import Patient from 'App/Models/Patient';
import Schedule from 'App/Models/Schedule';
import User from 'App/Models/User';
import Vaccine from 'App/Models/Vaccine';
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

  @column()
  public vaccine_id: string;

  @belongsTo(() => Vaccine, {
    foreignKey: 'vaccine_id',
  })
  public vaccine: BelongsTo<typeof Vaccine>;

  @column()
  public vaccine_protocol_id: string;

  @belongsTo(() => VaccineProtocol, {
    foreignKey: 'vaccine_protocol_id',
  })
  public protocol: BelongsTo<typeof VaccineProtocol>;

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

  @column()
  public business_unit_id: string;
}
