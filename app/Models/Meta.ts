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
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import BusinessUnitMeta from './BusinessUnitMeta';
import EconomicGroup from './EconomicGroup';

export default class Meta extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public description: string;

  @column()
  public type: string;

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
  public system_id: number;

  @column({
    serializeAs: null,
  })
  public economic_group_id: string;

  @belongsTo(() => EconomicGroup, {
    foreignKey: 'economic_group_id',
  })
  public group: BelongsTo<typeof EconomicGroup>;

  @hasMany(() => BusinessUnitMeta, {
    foreignKey: 'meta_id',
  })
  public units: HasMany<typeof BusinessUnitMeta>;
}
