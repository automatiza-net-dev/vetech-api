import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm';
import EconomicGroup from 'App/Models/EconomicGroup';
import VariationGroup from 'App/Models/VariationGroup';
import VariationOption from 'App/Models/VariationOption';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export const COLOR_VARIATION = 'a2531508-058e-4159-9dc2-7f7464113d46';
export const SIZE_VARIATION = '66dccf9f-6d47-487b-9a2f-927683a20f71';
export const VOLTAGE_VARIATION = 'c729f0c0-4168-4bde-b441-0eca7a1be357';

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

  @manyToMany(() => VariationGroup, {
    pivotTable: 'variation_group_variations',
    localKey: 'id',
    pivotForeignKey: 'variation_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'group_variation_id',
  })
  public variationGroups: ManyToMany<typeof VariationGroup>;
}
