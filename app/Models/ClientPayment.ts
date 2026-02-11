import { softDeleteQuery } from "App/Services/SoftDelete";
import {
  BaseModel,
  BelongsTo,
  beforeFetch,
  beforeFind,
  belongsTo,
  column,
  HasMany,
  hasMany,
} from "@ioc:Adonis/Lucid/Orm";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import BillPayment from "./BillPayment";
import ClientCredit from "./ClientCredit";
import ClientUsedCredit from "./ClientUsedCredit";
import Patient from "./Patient";
import PaymentMethod from "./PaymentMethod";
import User from "./User";

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

  @hasMany(() => ClientUsedCredit, {
    foreignKey: "client_payment_id",
  })
  public clientUsedCredits: HasMany<typeof ClientUsedCredit>;
}
