import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import EconomicGroup from 'App/Models/EconomicGroup';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';

export default class ScheduleServiceType extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column({
    columnName: 'reserved_minutes',
  })
  public reservedMinutes: number;

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
  public economic_group_id?: string;

  @belongsTo(() => EconomicGroup, {})
  public group: BelongsTo<typeof EconomicGroup>;

  @column()
  public schedule_service_group_id: string;

  @belongsTo(() => ScheduleServiceGroup, {})
  public serviceGroup: BelongsTo<typeof ScheduleServiceGroup>;
}
