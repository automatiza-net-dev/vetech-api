import { DateTime } from 'luxon';
import { BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm';
import ProductivityItemProduct from 'App/Models/ProductivityItemProduct';

export default class ProductivityItem extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public description: string;

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

  @hasMany(() => ProductivityItemProduct, {
    foreignKey: 'productivity_item_id',
  })
  public products: HasMany<typeof ProductivityItemProduct>;
}
