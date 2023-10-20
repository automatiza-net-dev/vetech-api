import { DateTime } from 'luxon';
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from './BusinessUnit';
import Meta from './Meta';

export default class BusinessUnitMeta extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public value: number;

  @column()
  public period: string;

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

  @belongsTo(() => BusinessUnit, {
    foreignKey: 'business_unit_id',
  })
  public unit: BelongsTo<typeof BusinessUnit>;

  @column({
    serializeAs: null,
  })
  public meta_id: number;

  @belongsTo(() => Meta, {
    foreignKey: 'meta_id',
  })
  public meta: BelongsTo<typeof Meta>;
}
