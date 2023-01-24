import {
  BaseModel,
  beforeFetch,
  beforeFind,
  belongsTo,
  BelongsTo,
  column,
  HasMany,
  hasMany,
} from '@ioc:Adonis/Lucid/Orm';
import BillItem from 'App/Models/BillItem';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import BillPayment from './BillPayment';
import Patient from './Patient';
import User from './User';

export enum BillStatus {
  A = 'ATIVA',
  E = 'EXTORNADA',
  F = 'FECHADA'
}

export default class Bill extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public tag: string;

  @column.dateTime({
    columnName: 'bill_date',
  })
  public billDate: DateTime;

  @column.dateTime({
    columnName: 'closing_date',
  })
  public closingDate: DateTime;

  @column({
    columnName: 'product_value',
  })
  public productValue: number;

  @column({
    columnName: 'service_value',
  })
  public serviceValue: number;

  @column({
    columnName: 'discount_value',
  })
  public discountValue: number;

  @column({
    columnName: 'fee_value',
  })
  public feeValue: number;

  @column({
    columnName: 'delivery_value',
  })
  public deliveryValue: number;

  @column({
    columnName: 'total_value',
  })
  public totalValue: number;

  @column({
    columnName: 'icms_base',
  })
  public icmsBase: number;

  @column({
    columnName: 'icms_value',
  })
  public icmsValue: number;

  @column({
    columnName: 'icms_st_base',
  })
  public icmsStBase: number;

  @column({
    columnName: 'icms_st_value',
  })
  public icmsStValue: number;

  @column({
    columnName: 'iss_base',
  })
  public issBase: number;

  @column({
    columnName: 'iss_value',
  })
  public issValue: number;

  @column({
    columnName: 'pis_base',
  })
  public pisBase: number;

  @column({
    columnName: 'pis_value',
  })
  public pisValue: number;

  @column({
    columnName: 'pis_retention_value',
  })
  public pisRetentionValue: number;

  @column({
    columnName: 'cofins_base',
  })
  public cofinsBase: number;

  @column({
    columnName: 'cofins_value',
  })
  public cofinsValue: number;

  @column({
    columnName: 'cofins_retention_value',
  })
  public cofinsRetentionValue: number;

  @column({
    columnName: 'ipi_base',
  })
  public ipiBase: number;

  @column({
    columnName: 'ipi_value',
  })
  public ipiValue: number;

  @column({
    columnName: 'icms_deferred_value',
  })
  public icmsDeferredValue: number;

  @column({
    columnName: 'icms_fcp_value',
  })
  public icmsFcpValue: number;

  @column({
    columnName: 'icms_uf_origin_value',
  })
  public icmsUfOriginValue: number;

  @column({
    columnName: 'icms_uf_destination_value',
  })
  public icmsUfDestinationValue: number;

  @column({
    columnName: 'other_value',
  })
  public otherValue: number;

  @column({
    columnName: 'additional_information',
  })
  public additionalInformation: string;

  @column({
    columnName: 'cancelled_at',
  })
  public cancelledAt: DateTime;

  @column({
    columnName: 'cancellation_observation',
  })
  public cancellationObservation: string;

  @column()
  public status: BillStatus;

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
  public client_id: string;

  @belongsTo(() => Patient, {
    foreignKey: 'client_id',
  })
  public client: BelongsTo<typeof Patient>;

  @column({
    serializeAs: null,
  })
  public patient_id: string;

  @belongsTo(() => Patient, {
    foreignKey: 'patient_id',
  })
  public patient: BelongsTo<typeof Patient>;

  @column({
    serializeAs: null,
  })
  public user_id: string;

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  public user: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public user_who_closed_id: string;

  @belongsTo(() => User, {
    foreignKey: 'user_who_closed_id',
  })

  public userWhoClosed: BelongsTo<typeof User>;
  @column({
    serializeAs: null,
  })
  public seller_id: string;

  @belongsTo(() => User, {
    foreignKey: 'seller_id',
  })
  public seller: BelongsTo<typeof User>;

  @column({
    serializeAs: null,
  })
  public daily_movement_id: string;

  @column({
    serializeAs: null,
  })
  public daily_cashier_id: string;

  @column({
    serializeAs: null,
  })
  public budget_id: string;

  @column({
    serializeAs: null,
  })
  public cancellation_user_id: string;

  @column({
    serializeAs: null,
  })
  public cancellation_reason_id: string;

  @hasMany(() => BillItem, {
    foreignKey: 'bill_id',
  })
  public items: HasMany<typeof BillItem>;

  @hasMany(() => BillPayment, {
    foreignKey: 'bill_id',
  })
  public payments: HasMany<typeof BillPayment>;

}
