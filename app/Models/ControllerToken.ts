import { DateTime } from 'luxon';
import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';

export default class ControllerToken extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({
    serializeAs: null,
  })
  public name: string;

  @column({
    serializeAs: null,
  })
  public type: string;

  @column()
  public token: string;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public expiresAt: DateTime;

  @column({
    serializeAs: null,
  })
  public user_id: string;
}
