import { BaseModel, HasMany, column, hasMany } from '@ioc:Adonis/Lucid/Orm';
import KitItem from 'App/Models/KitItem';
import { DateTime } from 'luxon';

export default class Kit extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public description: string;

  @column.dateTime({
    columnName: 'from_expiration',
  })
  public fromExpiration: DateTime;

  @column.dateTime({
    columnName: 'to_expiration',
  })
  public toExpiration: DateTime;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public economic_group_id: string;

  @hasMany(() => KitItem, {
    foreignKey: 'kit_id',
  })
  public items: HasMany<typeof KitItem>;
}
