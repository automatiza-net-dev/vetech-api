import { DateTime } from "luxon";
import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
} from "@ioc:Adonis/Lucid/Orm";
import { softDeleteQuery } from "App/Services/SoftDelete";
import Decimal from "decimal.js";

export default class ClientCredit extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({
    serializeAs: 'originalValue',
    columnName: 'original_value',
    consume: (value) => (value ? new Decimal(value) : null),
    prepare: (value) => value.toString(),
    serialize: (value: Decimal) => (value ? value.toNumber() : 0),
  })
  public originalValue: Decimal;

  @column({
    serializeAs: 'usedValue',
    columnName: 'used_value',
    consume: (value) => (value ? new Decimal(value) : null),
    prepare: (value) => value.toString(),
    serialize: (value: Decimal) => (value ? value.toNumber() : 0),
  })
  public usedValue: Decimal;

  @column({})
  public returned: boolean;

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

  @column({ serializeAs: null })
  public user_id: string;

  @column({ serializeAs: null })
  public reversed_by_user_id: string;

  @column({ serializeAs: null })
  public client_id: string;
}
