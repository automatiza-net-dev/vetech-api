import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from 'App/Models/BusinessUnit';
import Product from 'App/Models/Product';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class BusinessUnitProduct extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public stock: number;

  @column({
    columnName: 'maximum_stock',
  })
  public maximumStock: number;

  @column({
    columnName: 'minimum_stock',
  })
  public minimumStock: number;

  @column({
    columnName: 'maximum_discount_percentage',
  })
  public maximumDiscountPercetange: number;

  @column({
    columnName: 'maximum_discount_value',
  })
  public maximumDiscountValue: number;

  @column()
  public price: number;

  @column({
    columnName: 'cost_price',
  })
  public costPrice: number;

  @column({
    columnName: 'profit_margin',
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
  public product_id: number;

  @belongsTo(() => Product)
  public product: BelongsTo<typeof Product>;

  @column()
  public businnes_unit_id: number;

  @belongsTo(() => BusinessUnit)
  public businessUnit: BelongsTo<typeof BusinessUnit>;
}
