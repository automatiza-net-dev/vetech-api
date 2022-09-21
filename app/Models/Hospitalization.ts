import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
  hasMany,
  HasMany,
} from '@ioc:Adonis/Lucid/Orm';
import Bed from 'App/Models/Bed';
import HospitalizationMedicalPrescription from 'App/Models/HospitalizationMedicalPrescription';
import HospitalizationOccurrence from 'App/Models/HospitalizationOccurrence';
import Patient from 'App/Models/Patient';
import User from 'App/Models/User';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class Hospitalization extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public type: number;

  @column()
  public risk: number;

  @column.dateTime({
    columnName: 'expected_discharge',
  })
  public expectedDischarge: DateTime;

  @column()
  public diagnosis: string;

  @column()
  public prognosis: string;

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
  public economic_group_id: string;

  @column({
    serializeAs: null,
  })
  public business_unit_id: string;

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
  public tutor_id: string;

  @belongsTo(() => Patient, {
    foreignKey: 'tutor_id',
  })
  public tutor: BelongsTo<typeof Patient>;

  @column({
    serializeAs: null,
  })
  public technician_id: string;

  @belongsTo(() => User, {
    foreignKey: 'technician_id',
  })
  public technician: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public bed_id: string;

  @belongsTo(() => Bed, {
    foreignKey: 'bed_id',
  })
  public bed: BelongsTo<typeof Bed>;

  @hasMany(() => HospitalizationMedicalPrescription, {
    foreignKey: 'hospitalization_id',
  })
  public medicalPrescriptions: HasMany<
    typeof HospitalizationMedicalPrescription
  >;

  @hasMany(() => HospitalizationOccurrence, {
    foreignKey: 'hospitalization_id',
  })
  public occurrences: HasMany<typeof HospitalizationOccurrence>;
}
