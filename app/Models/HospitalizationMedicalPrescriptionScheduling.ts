import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import Hospitalization from 'App/Models/Hospitalization';
import HospitalizationMedicalPrescription from 'App/Models/HospitalizationMedicalPrescription';
import {
  MedicalPrescriptionFrequency,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import User from 'App/Models/User';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum HospitalizationSchedulingStatus {
  'ACTIVE' = 'A',
  'COMPLETE' = 'C',
  'CANCELED' = 'CA',
  'EXCLUDED' = 'E',
}

export default class HospitalizationMedicalPrescriptionScheduling extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public type: MedicalPrescriptionType;

  @column()
  public frequency: MedicalPrescriptionFrequency;

  @column.dateTime({
    columnName: 'scheduled_at',
  })
  public scheduledAt: DateTime;

  @column.dateTime({
    columnName: 'executed_at',
  })
  public executedAt: DateTime;

  @column.dateTime({
    columnName: 'prescribed_at',
  })
  public prescribedAt: DateTime;

  @column.dateTime({
    columnName: 'excluded_at',
  })
  public excludedAt: DateTime;

  @column()
  public description: string;

  @column()
  public resume: string;

  @column()
  public status: HospitalizationSchedulingStatus;

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
  public hospitalization_medical_prescription_id: string;

  @belongsTo(() => HospitalizationMedicalPrescription, {
    foreignKey: 'hospitalization_medical_prescription_id',
  })
  public prescription: BelongsTo<typeof HospitalizationMedicalPrescription>;

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
  public user_id: string;

  @column({
    serializeAs: null,
  })
  public execution_user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'execution_user_id',
  })
  public executionUser: BelongsTo<typeof User>;

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  public technician: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public update_user_id: string | null;
}
