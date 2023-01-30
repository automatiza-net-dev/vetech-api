import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

export default class ConfirmationToken extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public name: string;

  @column()
  public phone: string;

  @column()
  public email: string;

  @column()
  public code: string;

  @column()
  public active: boolean;

  @column.dateTime({
    columnName: 'expires_at',
  })
  public expiresAt: DateTime;

  @column.dateTime({
    columnName: 'confirmed_at',
  })
  public confirmedAt: DateTime;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;
}
