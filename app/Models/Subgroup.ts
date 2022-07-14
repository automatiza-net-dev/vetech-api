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
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class Subgroup extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public description: string;

  @column()
  public active: boolean;

  @column({
    prepare: value => JSON.stringify(value),
    consume: value => JSON.parse(value),
  })
  public tree: Array<string>;

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

  @belongsTo(() => EconomicGroup)
  public economicGroup: BelongsTo<typeof EconomicGroup>;

  @column()
  public parent_id?: string;

  @belongsTo(() => Subgroup, {
    localKey: 'id',
    foreignKey: 'parent_id',
  })
  // eslint-disable-next-line no-use-before-define
  public parent: BelongsTo<typeof Subgroup>;

  @hasMany(() => Subgroup, {
    localKey: 'id',
    foreignKey: 'parent_id',
  })
  // eslint-disable-next-line no-use-before-define
  public children: HasMany<typeof Subgroup>;
}
