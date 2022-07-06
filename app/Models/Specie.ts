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
import EconomicGroup from 'App/Models/EconomicGroup';
import Race from 'App/Models/Race';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';

export default class Specie extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column()
  public description: string;

  @column()
  public economic_group_id: string;

  @column()
  public code: string;

  @belongsTo(() => EconomicGroup, {})
  public economicGroup: BelongsTo<typeof EconomicGroup>;

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

  @hasMany(() => Race, {
    foreignKey: 'specie_id',
  })
  public races: HasMany<typeof Race>;
}
