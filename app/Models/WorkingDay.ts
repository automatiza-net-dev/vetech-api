import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import EconomicGroup from 'App/Models/EconomicGroup';
import WeekDay from 'App/Models/shared/WeekDay';
import User from 'App/Models/User';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class WorkingDay extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public day_of_week: WeekDay;

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

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>;

  @belongsTo(() => EconomicGroup)
  public economicGroup: BelongsTo<typeof EconomicGroup>;
}
