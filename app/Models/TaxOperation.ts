import {
  BaseModel,
  beforeFetch,
  beforeFind,
  belongsTo,
  BelongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import EconomicGroup from 'App/Models/EconomicGroup';
import { MovementCategory, MovementType } from 'App/Models/TaxationGroupRule';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class TaxOperation extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public code: string;

  @column()
  public description: string;

  @column({
    columnName: 'movement_type',
  })
  public movementType: MovementType;

  @column({
    columnName: 'movement_category',
  })
  public movementCategory: MovementCategory;

  @column({
    columnName: 'generates_financial',
  })
  public generatesFinancial: boolean;

  @column({
    columnName: 'accounting_result',
  })
  public accountingResult: boolean;

  @column()
  public active: boolean;

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

  @belongsTo(() => EconomicGroup, {
    foreignKey: 'economic_group_id',
  })
  public economicGroup: BelongsTo<typeof EconomicGroup>;
}
