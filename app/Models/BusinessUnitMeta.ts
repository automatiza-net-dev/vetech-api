import { DateTime } from 'luxon';
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import BusinessUnit from './BusinessUnit';

export const MetaType = ['Faturamento'] as const;
export type TMetaType = typeof MetaType[number];

export const ValueMetaType = ['Valor R$', 'Percentual', 'Quantidade'] as const;
export type TValueMetaType = typeof ValueMetaType[number];

export const MetaPeriod = ['Ano', 'Mes'] as const;
export type TMetaPeriod = typeof MetaPeriod[number];

export default class BusinessUnitMeta extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public type: typeof MetaType[number];

  @column()
  public value: number;

  @column({
    columnName: 'value_type',
  })
  public valueType: typeof ValueMetaType[number];

  @column()
  public period: typeof MetaPeriod[number];

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
}
