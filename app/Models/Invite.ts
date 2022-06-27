import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import User from 'App/Models/User';
import { DateTime } from 'luxon';

export default class Invite extends BaseModel {
  @column({ isPrimary: true })
  public id: string;

  @belongsTo(() => BusinessUnit, {})
  public businessUnit: BelongsTo<typeof BusinessUnit>;

  @column()
  public business_unit_id: string;

  @column()
  public role_id: number;

  @belongsTo(() => User, {})
  public user: BelongsTo<typeof User>;

  @column()
  public user_id?: string;

  @column()
  public email: string;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}
