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
import EconomicGroup from 'App/Models/EconomicGroup';
import VariationOption from 'App/Models/VariationOption';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class Variation extends BaseModel {
  @column({ isPrimary: true })
  public id = v4();

  @column()
  public description: string;

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

  @column()
  public economic_group_id: string;

  @belongsTo(() => EconomicGroup, {})
  public economicGroup: BelongsTo<typeof EconomicGroup>;

  @hasMany(() => VariationOption, {
    localKey: 'id',
    foreignKey: 'variation_id',
  })
  public options: HasMany<typeof VariationOption>;
}
