import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import Patient from 'App/Models/Patient';
import PatientAnimalHair from 'App/Models/PatientAnimalHair';
import Race from 'App/Models/Race';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class PatientAnimal extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public registered: boolean;

  @column()
  public death: boolean;

  @column.dateTime({
    columnName: 'death_date',
  })
  public deathDate?: DateTime;

  @column()
  public microchip: string;

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
  public patient_id: string;

  @belongsTo(() => Patient, {
    localKey: 'id',
    foreignKey: 'patient_id',
  })
  public patient: BelongsTo<typeof Patient>;

  @column({
    serializeAs: null,
  })
  public race_id: string;

  @belongsTo(() => Race, {
    localKey: 'id',
    foreignKey: 'race_id',
  })
  public race: BelongsTo<typeof Race>;

  @column({
    serializeAs: null,
  })
  public hair_id: string;

  @belongsTo(() => PatientAnimalHair, {
    localKey: 'id',
    foreignKey: 'hair_id',
  })
  public hair: BelongsTo<typeof PatientAnimalHair>;
}
