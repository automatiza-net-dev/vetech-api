import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import Role from 'App/Models/Role';
import User from 'App/Models/User';
import { DateTime } from 'luxon';

export default class UserUnitRole extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public user_id: string;

  @column()
  public unit_id: string;

  @column()
  public role_id: number;

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>;

  @belongsTo(() => BusinessUnit)
  public unit: BelongsTo<typeof BusinessUnit>;

  @belongsTo(() => Role)
  public role: BelongsTo<typeof Role>;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;
}
