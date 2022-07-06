import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import EconomicGroup from 'App/Models/EconomicGroup';
import User from 'App/Models/User';
import { DateTime } from 'luxon';

export default class UnavailableDay extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @column.dateTime({
    columnName: 'start_hour',
  })
  public startHour: DateTime;

  @column.dateTime({
    columnName: 'end_hour',
  })
  public endHour: DateTime;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column()
  public user_id: string;

  @column()
  public economic_group_id: string;

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>;

  @belongsTo(() => EconomicGroup)
  public economicGroup: BelongsTo<typeof EconomicGroup>;
}
