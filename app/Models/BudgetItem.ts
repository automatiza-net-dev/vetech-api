import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import ProductVariation from 'App/Models/ProductVariation';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class BudgetItem extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public quantity: number;

  @column({
    columnName: 'unitary_value',
  })
  public unitaryValue: number;

  @column({
    columnName: 'discount_value',
  })
  public discountValue: number;

  @column({
    columnName: 'total_value',
  })
  public totalValue: number;

  @column()
  public status: string;

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

  @column({
    serializeAs: null,
  })
  public economic_group_id: string;

  @column({
    serializeAs: null,
  })
  public business_unit_id: string;

  @column({
    serializeAs: null,
  })
  public budget_id: string;

  @column({
    serializeAs: null,
  })
  public product_variation_id: string;

  @belongsTo(() => ProductVariation, {
    foreignKey: 'product_variation_id',
  })
  public productVariation: BelongsTo<typeof ProductVariation>;
}
