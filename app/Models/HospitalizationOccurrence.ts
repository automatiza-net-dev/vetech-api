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
import Hospitalization from 'App/Models/Hospitalization';
import HospitalizationMedicalPrescription from 'App/Models/HospitalizationMedicalPrescription';
import HospitalizationOccurrenceAttachment from 'App/Models/HospitalizationOccurrenceAttachment';
import Occurrence from 'App/Models/Occurrence';
import User from 'App/Models/User';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class HospitalizationOccurrence extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column.dateTime({
    columnName: 'previewed_at',
  })
  public previewedAt: DateTime;

  @column.dateTime({
    columnName: 'executed_at',
  })
  public executedAt: DateTime;

  @column()
  public description: string;

  @column()
  public resume: string;

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
  public hospitalization_id: string;

  @belongsTo(() => Hospitalization, {
    foreignKey: 'hospitalization_id',
  })
  public hospitalization: BelongsTo<typeof Hospitalization>;

  @column({
    serializeAs: null,
  })
  public occurrence_id: string;

  @belongsTo(() => Occurrence, {
    foreignKey: 'occurrence_id',
  })
  public occurrence: BelongsTo<typeof Occurrence>;

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
  public exclusion_user_id: string;

  @column({
    serializeAs: null,
  })
  public hospitalization_medical_prescription_id: string;

  @belongsTo(() => HospitalizationMedicalPrescription, {
    foreignKey: 'hospitalization_medical_prescription_id',
  })
  public prescription: BelongsTo<typeof HospitalizationMedicalPrescription>;

  @hasMany(() => HospitalizationOccurrenceAttachment, {
    foreignKey: 'hospitalization_occurrence_id',
  })
  public attachments: HasMany<typeof HospitalizationOccurrenceAttachment>;
}
