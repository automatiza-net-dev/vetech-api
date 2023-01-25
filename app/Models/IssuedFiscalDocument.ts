import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class IssuedFiscalDocument extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column({
    columnName: 'movement_type',
  })
  public movementType: string;

  @column()
  model: string;

  @column()
  series: string;

  @column()
  sequence: number;

  @column()
  purpose: string;

  @column({
    columnName: 'access_key',
  })
  accessKey: string;

  @column({
    columnName: 'access_key_ref',
  })
  accessKeyRef: string;

  @column.dateTime({
    columnName: 'authorization_date',
  })
  public authorizationDate: DateTime;

  @column({
    columnName: 'authorization_receipt',
  })
  authorizationReceipt: string;

  // cancellation
  @column.dateTime({
    columnName: 'cancellation_date',
  })
  public cancellationDate: DateTime;

  @column({
    columnName: 'cancellation_receipt',
  })
  cancellationReceipt: string;

  @column.dateTime({
    columnName: 'cancellation_receipt_date',
  })
  public cancellationReceiptDate: DateTime;

  @column({
    columnName: 'cancellation_reason',
  })
  cancellationReason: string;

  // disabling
  @column.dateTime({
    columnName: 'disabling_date',
  })
  public disablingDate: DateTime;

  @column({
    columnName: 'disabling_receipt',
  })
  disablingReceipt: string;

  @column.dateTime({
    columnName: 'disabling_receipt_date',
  })
  public disablingReceiptDate: DateTime;

  @column({
    columnName: 'disabling_reason',
  })
  disablingReason: string;
  //

  @column()
  contingency: string;

  @column.dateTime({
    columnName: 'contingency_date',
  })
  public contingencyDate: DateTime;

  @column({
    columnName: 'contingency_reason',
  })
  public contingencyReason: string;

  @column.dateTime({
    columnName: 'contingency_delivery_date',
  })
  public contingencyDeliveryDate: DateTime;

  //
  @column()
  active: boolean;

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
  public user_who_authorized_id: string;

  @column({
    serializeAs: null,
  })
  public user_who_cancelled_id: string;

  @column({
    serializeAs: null,
  })
  public user_who_disabled_id: string;

  @column({
    serializeAs: null,
  })
  public user_who_did_contingency_id: string;
}
