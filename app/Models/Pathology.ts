import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import EconomicGroup from 'App/Models/EconomicGroup';
import TimelineType from 'App/Models/TimelineType';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class Pathology extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public description: string;

  @column()
  public definition: string;

  @column()
  public template: string;

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
  public timeline_type_id: string;

  @belongsTo(() => TimelineType, {
    foreignKey: 'timeline_type_id',
    localKey: 'id',
  })
  public timelineType: BelongsTo<typeof TimelineType>;

  @column()
  public economic_group_id: string;

  @belongsTo(() => EconomicGroup, {
    foreignKey: 'economic_group_id',
    localKey: 'id',
  })
  public group: BelongsTo<typeof EconomicGroup>;
}
