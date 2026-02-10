import { DateTime } from "luxon";
import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
  HasMany,
  hasMany,
} from "@ioc:Adonis/Lucid/Orm";
import { softDeleteQuery } from "App/Services/SoftDelete";
import Decimal from "decimal.js";
import User from "./User";
import PaymentMethod from "./PaymentMethod";
import BillPayment from "./BillPayment";
import ClientCredit from "./ClientCredit";
import Patient from "./Patient";

export default class ClientPayment extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column({
    consume: (value) => (value ? new Decimal(value) : null),
    prepare: (value) => value.toString(),
    serialize: (value: Decimal) => (value ? value.toNumber() : 0),
  })
  public value: Decimal;

  @column({})
  public installments: number;

  @column.dateTime({})
  public paymentDate: DateTime;

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
  public cashier_id: string;

  @column({ serializeAs: null })
  public movement_id: string;

  @column({ serializeAs: null })
  public payment_method_id: string | null;

  @belongsTo(() => User, {
    foreignKey: "user_id",
  })
  public user: BelongsTo<typeof User>;

  @belongsTo(() => Patient, {
    foreignKey: "client_id",
  })
  public client: BelongsTo<typeof Patient>;

  @belongsTo(() => PaymentMethod, {
    foreignKey: "payment_method_id",
  })
  public paymentMethod: BelongsTo<typeof PaymentMethod>;

  @hasMany(() => BillPayment, {
    foreignKey: "client_payment_id",
  })
  public billPayments: HasMany<typeof BillPayment>;

  @hasMany(() => ClientCredit, {
    foreignKey: "client_payment_id",
  })
  public clientCredits: HasMany<typeof ClientCredit>;
}
