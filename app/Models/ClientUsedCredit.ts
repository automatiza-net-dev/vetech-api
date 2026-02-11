import { softDeleteQuery } from "App/Services/SoftDelete";
import { BaseModel, beforeFetch, beforeFind, column } from "@ioc:Adonis/Lucid/Orm";
import Decimal from "decimal.js";
import { DateTime } from "luxon";

export default class ClientUsedCredit extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({
    serializeAs: "valueBefore",
    columnName: "value_before",
    consume: (value) => (value ? new Decimal(value) : null),
    prepare: (value) => value.toString(),
    serialize: (value: Decimal) => (value ? value.toNumber() : 0),
  })
  public valueBefore: Decimal;

  @column({
    serializeAs: "usedValue",
    columnName: "used_value",
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
  public client_id: string;

  @column({ serializeAs: null })
  public client_payment_id: number;

  @column({ serializeAs: null })
  public client_credit_id: number;

  @column({ serializeAs: null })
  public reversed_by_user_id: string;
}
