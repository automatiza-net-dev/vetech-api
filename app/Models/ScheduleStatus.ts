import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import EconomicGroup from 'App/Models/EconomicGroup';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class ScheduleStatus extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public description: string;

  @column()
  public color: string;

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
  public economic_group_id?: string;

  @belongsTo(() => EconomicGroup)
  public economicGroup: BelongsTo<typeof EconomicGroup>;
}
