import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum DailyCashierEntryType {
  D = 'DEBITO',
  C = 'CREDITO',
}

export enum DailyCashierEntryStatus {
  A = 'ATIVO',
}

export default class DailyCashierEntry extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column.dateTime({
    columnName: 'entry_date',
  })
  public entryDate: DateTime;

  @column()
  public type: DailyCashierEntryType;

  @column()
  public description: string;

  @column({
    serialize: parseFloat,
  })
  public value: number;

  @column()
  public status: DailyCashierEntryStatus;

  @column()
  public tag: number;

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
  public business_unit_id: string;

  @column({
    serializeAs: null,
  })
  public daily_cashier_id: string;
}
