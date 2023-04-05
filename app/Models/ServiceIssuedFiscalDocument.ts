import {
  BaseModel,
  beforeFetch,
  beforeFind,
  BelongsTo,
  belongsTo,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import BillItem from 'App/Models/BillItem';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class ServiceIssuedFiscalDocument extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  model: string;

  @column()
  sequence: number;

  @column({
    columnName: 'rps_number',
  })
  rpsNumber: number;

  @column({
    columnName: 'rps_series',
  })
  rpsSeries: number;

  @column({
    columnName: 'rps_type',
  })
  rpsType: string;

  @column({
    columnName: 'verification_code',
  })
  verificationCode: string;

  @column({})
  errors: Array<unknown>;

  // authorization
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

  @column.dateTime({
    columnName: 'cancellation_receipt_date',
  })
  public cancellationReceiptDate: DateTime;

  @column({
    columnName: 'cancellation_reason',
  })
  cancellationReason: string;

  @column({
    columnName: 'mirror_path',
  })
  mirrorPath: string;

  @column({
    columnName: 'authorization_xml_path',
  })
  authorizationXmlPath: string;

  @column({
    columnName: 'authorization_pdf_path',
  })
  authorizationPdfPath: string;

  @column()
  status: string;

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
  public bill_id: string;

  @column({
    serializeAs: null,
  })
  public bill_item_id: string;

  @belongsTo(() => BillItem, {
    foreignKey: 'bill_item_id',
  })
  public billItem: BelongsTo<typeof BillItem>;

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
  public fiscal_document_id: string;
}
