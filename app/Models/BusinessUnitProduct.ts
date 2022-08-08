import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import ProductVariation from 'App/Models/ProductVariation';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class BusinessUnitProduct extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column({
    serialize: parseFloat,
  })
  public stock: number;

  @column({
    columnName: 'maximum_stock',
    serialize: parseFloat,
  })
  public maximumStock: number;

  @column({
    columnName: 'minimum_stock',
    serialize: parseFloat,
  })
  public minimumStock: number;

  @column({
    columnName: 'maximum_discount_percentage',
    serialize: parseFloat,
  })
  public maximumDiscountPercentage: number;

  @column({
    columnName: 'maximum_discount_value',
    serialize: parseFloat,
  })
  public maximumDiscountValue: number;

  @column({
    serialize: parseFloat,
  })
  public price: number;

  @column({
    columnName: 'cost_price',
    serialize: parseFloat,
  })
  public costPrice: number;

  @column({
    columnName: 'profit_margin',
    serialize: parseFloat,
  })
  public profitMargin: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

  @column.dateTime({ serializeAs: null })
  public deletedAt: DateTime;

  @beforeFind()
  public static softDeletesFind = softDeleteQuery;

  @beforeFetch()
  public static softDeletesFetch = softDeleteQuery;

  public async softDelete(column?: string) {
    await softDelete(this, column);
  }

  @column()
  public product_variation_id: string;

  @belongsTo(() => ProductVariation)
  public productVariation: BelongsTo<typeof ProductVariation>;

  @column()
  public businness_unit_id: string;

  @belongsTo(() => BusinessUnit)
  public businessUnit: BelongsTo<typeof BusinessUnit>;
}
