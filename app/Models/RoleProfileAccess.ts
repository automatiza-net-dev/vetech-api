import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';

export default class RoleProfileAccess extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column({
    serializeAs: null,
  })
  public role_id: number;

  @column({
    serializeAs: null,
  })
  public profile_access_id: number;
}
