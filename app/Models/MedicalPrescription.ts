import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import DrugAdministration from 'App/Models/DrugAdministration';
import Unit from 'App/Models/Unit';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum MedicalPrescriptionType {
  'PROCEDURE' = 'PROCEDURE',
  'MEDICATION' = 'MEDICATION',
  'FLUID_THERAPY' = 'FLUID_THERAPY',
}

export enum MedicalPrescriptionFrequency {
  'RECURRENT' = 'RECURRENT',
  'ONCE' = 'ONCE',
  'WHEN_NEEDED' = 'WHEN_NEEDED',
}

export enum MedicalPrescriptionFrequencyUnit {
  'HOUR' = 'HOUR',
  'DAY' = 'DAY',
}

export enum MedicalPrescriptionFrequencyQuantityUnit {
  'HOUR' = 'HOUR',
  'DAY' = 'DAY',
  'TIMES' = 'TIMES',
}

export enum MedicalPrescriptionFluidSet {
  'MACRODROPS' = 'MACRODROPS',
  'MICRODROPS' = 'MICRODROPS',
}

export const MedicalPrescriptionFluidSetLabel: Record<
  MedicalPrescriptionFluidSet,
  string
> = {
  [MedicalPrescriptionFluidSet.MACRODROPS]: 'MacroGotas',
  [MedicalPrescriptionFluidSet.MICRODROPS]: 'MicroGotas',
};

export default class MedicalPrescription extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public name: string;

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
  public business_unit_id: string;

  @column({
    serializeAs: null,
  })
  public drug_administration_id: string;

  @belongsTo(() => DrugAdministration, {
    foreignKey: 'drug_administration_id',
  })
  public drugAdministration: BelongsTo<typeof DrugAdministration>;
}
