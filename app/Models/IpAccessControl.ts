import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';
import User from 'App/Models/User';
import BusinessUnit from './BusinessUnit';

export default class IpAccessControl extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({
    columnName: 'ip_address',
  })
  public ipAddress: string;

  @column({})
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column({
    serializeAs: null,
  })
  public business_unit_id: string;

  @belongsTo(() => BusinessUnit, {
    foreignKey: 'business_unit_id',
    localKey: 'id',
  })
  public unit: BelongsTo<typeof BusinessUnit>;

  @column({
    serializeAs: null,
  })
  public user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'user_id',
    localKey: 'id',
  })
  public user: BelongsTo<typeof User>;
}
