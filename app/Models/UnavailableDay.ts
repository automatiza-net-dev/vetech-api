import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import WeekDay from 'App/Models/shared/WeekDay';
import User from 'App/Models/User';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class UnavailableDay extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public title: string;

  @column({
    columnName: 'start_date',
  })
  public startDate: DateTime | null;

  @column({
    columnName: 'end_date',
  })
  public endDate: DateTime | null;

  @column({
    columnName: 'start_hour',
  })
  public startHour: string;

  @column({
    columnName: 'end_hour',
  })
  public endHour: string;

  @column({
    prepare(value) {
      return value.join(',');
    },
    consume(value) {
      return value.split(',');
    },
  })
  public frequency: Array<WeekDay>;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column()
  public user_id: string;

  @column()
  public business_unit_id: string;

  @belongsTo(() => User, {
    localKey: 'id',
    foreignKey: 'user_id',
  })
  public user: BelongsTo<typeof User>;

  @belongsTo(() => BusinessUnit)
  public businessUnit: BelongsTo<typeof BusinessUnit>;
}
