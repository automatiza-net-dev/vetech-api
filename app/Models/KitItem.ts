import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import Kit from 'App/Models/Kit';
import ProductVariation from 'App/Models/ProductVariation';
import { DateTime } from 'luxon';

export default class KitItem extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public quantity: number;

  @column({
    columnName: 'original_price',
  })
  public originalPrice: number;

  @column({
    columnName: 'discount_price',
  })
  public discountPrice: number;

  @column({
    columnName: 'discount_percentage',
  })
  public discountPercentage: number;

  @column({
    columnName: 'sale_price',
  })
  public salePrice: number;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column({
    serializeAs: null,
  })
  public business_unit_id: string;

  @column({
    serializeAs: null,
  })
  public kit_id: number;

  @belongsTo(() => Kit, {
    foreignKey: 'kit_id',
  })
  public kit: BelongsTo<typeof Kit>;

  @column({
    serializeAs: null,
  })
  public product_variation_id: string;

  @belongsTo(() => ProductVariation, {
    foreignKey: 'product_variation_id',
  })
  public productVariation: BelongsTo<typeof ProductVariation>;
}
