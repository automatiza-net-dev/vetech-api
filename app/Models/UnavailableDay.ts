import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import User from 'App/Models/User';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class UnavailableDay extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

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
  public business_unit_id: string;

  @belongsTo(() => User, {
    localKey: 'id',
    foreignKey: 'user_id',
  })
  public user: BelongsTo<typeof User>;

  @belongsTo(() => BusinessUnit)
  public businessUnit: BelongsTo<typeof BusinessUnit>;
}
