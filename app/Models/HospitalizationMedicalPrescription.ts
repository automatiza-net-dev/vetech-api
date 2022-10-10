import {
  BaseModel,
  beforeFetch,
  beforeFind,
  belongsTo,
  BelongsTo,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm';
import DrugAdministration from 'App/Models/DrugAdministration';
import Hospitalization from 'App/Models/Hospitalization';
import HospitalizationMedicalPrescriptionScheduling from 'App/Models/HospitalizationMedicalPrescriptionScheduling';
import {
  MedicalPrescriptionFluidSet,
  MedicalPrescriptionFrequency,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import Unit from 'App/Models/Unit';
import User from 'App/Models/User';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class HospitalizationMedicalPrescription extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public type: MedicalPrescriptionType;

  @column.dateTime({
    columnName: 'prescribed_at',
  })
  public prescribedAt: DateTime;

  @column()
  public frequency: MedicalPrescriptionFrequency;

  @column({
    columnName: 'frequency_interval',
  })
  public frequencyInterval: number;

  @column({
    columnName: 'frequency_unit',
  })
  public frequencyUnit: MedicalPrescriptionFrequencyUnit;

  @column({
    columnName: 'frequency_quantity',
  })
  public frequencyQuantity: number;

  @column({
    columnName: 'frequency_quantity_unit',
  })
  public frequencyQuantityUnit: MedicalPrescriptionFrequencyQuantityUnit;

  @column()
  public description: string;

  @column()
  public resume: string;

  @column()
  public dose: number;

  @column({
    columnName: 'fluid_set',
  })
  public fluidSet: MedicalPrescriptionFluidSet;

  @column({
    columnName: 'fluid_speed',
  })
  public fluidSpeed: number;

  @column()
  public supplement: string;

  @column()
  public active: boolean;

  @column.dateTime({ columnName: 'execution_start' })
  public executionStart: DateTime;

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
  public hospitalization_id: string;

  @belongsTo(() => Hospitalization, {
    foreignKey: 'hospitalization_id',
  })
  public hospitalization: BelongsTo<typeof Hospitalization>;

  @column({
    serializeAs: null,
  })
  public user_id?: string;

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  public user: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public prescription_unit_id: string;

  @belongsTo(() => Unit, {
    foreignKey: 'prescription_unit_id',
  })
  public prescriptionUnit: BelongsTo<typeof Unit>;

  @column({
    serializeAs: null,
  })
  public fluid_unit_id: string;

  @belongsTo(() => Unit, {
    foreignKey: 'fluid_unit_id',
  })
  public fluidUnit: BelongsTo<typeof Unit>;

  @column({
    serializeAs: null,
  })
  public drug_administration_id: string;

  @belongsTo(() => DrugAdministration, {
    foreignKey: 'drug_administration_id',
  })
  public drugAdministration: BelongsTo<typeof DrugAdministration>;

  @hasMany(() => HospitalizationMedicalPrescriptionScheduling, {
    foreignKey: 'hospitalization_medical_prescription_id',
  })
  public scheduling: HasMany<
    typeof HospitalizationMedicalPrescriptionScheduling
  >;
}
