import {
  BaseModel,
  BelongsTo,
  belongsTo,
  column,
  ManyToMany,
  manyToMany,
} from '@ioc:Adonis/Lucid/Orm';
import ProductVariation from 'App/Models/ProductVariation';
import Variation from 'App/Models/Variation';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class VariationOption extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public description: string;

  @column()
  public active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column()
  public variation_id: string;

  @belongsTo(() => Variation, {})
  public variation: BelongsTo<typeof Variation>;

  @manyToMany(() => ProductVariation, {
    pivotTable: 'product_variation_options',
    pivotTimestamps: false,
    localKey: 'id',
    pivotForeignKey: 'product_variation_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'variation_option_id',
  })
  public productVariations: ManyToMany<typeof ProductVariation>;
}
