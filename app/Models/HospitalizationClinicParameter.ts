import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import ClinicParameter from 'App/Models/ClinicParameter';
import User from 'App/Models/User';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class HospitalizationClinicParameter extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column.dateTime({
    columnName: 'executed_at',
  })
  public executedAt: DateTime;

  @column.dateTime({
    columnName: 'released_at',
  })
  public releasedAt: DateTime;

  @column()
  public value: string;

  @column()
  public resume: string;

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
  public hospitalization_id: string;

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
  public clinic_parameter_id: string;

  @belongsTo(() => ClinicParameter, {
    foreignKey: 'clinic_parameter_id',
  })
  public parameter: BelongsTo<typeof ClinicParameter>;
}
