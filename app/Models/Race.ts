import {
  BaseModel,
  beforeFetch,
  beforeFind,
  belongsTo,
  BelongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import Specie from 'App/Models/Specie';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';

export default class Race extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public description: string;

  @column()
  public specie_id: string;

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

  @belongsTo(() => Specie, {})
  public specie: BelongsTo<typeof Specie>;
}
