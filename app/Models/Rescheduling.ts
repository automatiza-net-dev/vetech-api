import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import Reason from 'App/Models/Reason';
import Schedule from 'App/Models/Schedule';
import User from 'App/Models/User';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class Rescheduling extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public observation: string;

  @column({
    columnName: 'original_date',
    serializeAs: null,
  })
  public originalDate: DateTime;

  @column({
    columnName: 'new_date',
    serializeAs: null,
  })
  public newDate: DateTime;

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
  public schedule_id: string;

  @belongsTo(() => Schedule, {
    foreignKey: 'schedule_id',
  })
  public schedule: BelongsTo<typeof Schedule>;

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
  public reason_id: string;

  @belongsTo(() => Reason, {
    foreignKey: 'reason_id',
  })
  public reason: BelongsTo<typeof Reason>;
}
