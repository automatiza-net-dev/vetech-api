import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { v4 } from 'uuid';

export default class ThirdPartyUserPermission extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public key = v4();

  @column()
  public password: string;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({})
  public disabledAt: DateTime | null;

  @column({
    serializeAs: null,
  })
  public user_id: string;

  @column({
    serializeAs: null,
  })
  public system_id: number;
}
