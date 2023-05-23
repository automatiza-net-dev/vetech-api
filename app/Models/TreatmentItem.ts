import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import Kit from 'App/Models/Kit';
import ProductVariation from 'App/Models/ProductVariation';
import { DateTime } from 'luxon';

const TreatmentItemStatus = ['Ativo'] as const;
export type TreatmentItemStatus = typeof TreatmentItemStatus[number];

export default class TreatmentItem extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public quantity: number;

  @column({
    columnName: 'quantity_executed',
  })
  public quantityExecuted: number;

  @column()
  public observations: string;

  @column()
  public status: TreatmentItemStatus;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime;

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
  public treatment_id: number;

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
