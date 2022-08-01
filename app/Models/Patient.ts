import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
  HasMany,
  hasMany,
  HasOne,
  hasOne,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm';
import EconomicGroup from 'App/Models/EconomicGroup';
import PatientTutor from 'App/Models/PatientTutor';
import Schedule from 'App/Models/Schedule';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';

export enum PatientType {
  TUTOR = 'tutor',
  ANIMAL = 'animal',
}

export enum PatientGender {
  MALE = 'male',
  FEMALE = 'female',
}

export default class Patient extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public name: string;

  @column()
  public type: PatientType;

  @column()
  public photo?: string;

  @column()
  public gender: PatientGender;

  @column()
  public tags: string;

  @column({
    columnName: 'birth_date',
  })
  public birthDate: Date;

  @column()
  public active: boolean;

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

  @manyToMany(() => EconomicGroup, {
    pivotTable: 'patient_economic_groups',
    pivotTimestamps: true,
  })
  public economicGroup: ManyToMany<typeof EconomicGroup>;

  @hasOne(() => PatientTutor, {
    localKey: 'id',
    foreignKey: 'patient_id',
  })
  public tutor: HasOne<typeof PatientTutor>;

  @manyToMany(() => Patient, {
    pivotTable: 'holder_dependents',
    pivotTimestamps: true,
    localKey: 'id',
    pivotForeignKey: 'dependent_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'holder_id',
  })
  // eslint-disable-next-line no-use-before-define
  public tutors: ManyToMany<typeof Patient>;

  @manyToMany(() => Patient, {
    pivotTable: 'holder_dependents',
    pivotTimestamps: true,
    localKey: 'id',
    pivotForeignKey: 'holder_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'dependent_id',
  })
  // eslint-disable-next-line no-use-before-define
  public dependents: ManyToMany<typeof Patient>;

  @hasMany(() => Schedule, {
    localKey: 'id',
    foreignKey: 'patient_id',
  })
  public schedules: HasMany<typeof Schedule>;
}
