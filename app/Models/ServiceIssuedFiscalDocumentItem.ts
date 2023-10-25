import { DateTime } from 'luxon';
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm';
import ServiceIssuedFiscalDocument from './ServiceIssuedFiscalDocument';
import Bill from './Bill';

export default class ServiceIssuedFiscalDocumentItem extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;

  @column({
    serializeAs: null,
  })
  public service_issued_fiscal_document_id: string;

  @belongsTo(() => ServiceIssuedFiscalDocument, {
    foreignKey: 'service_issued_fiscal_document_id',
  })
  public service: BelongsTo<typeof ServiceIssuedFiscalDocument>;

  @column({
    serializeAs: null,
  })
  public bill_item_id: string;

  @belongsTo(() => Bill, {
    foreignKey: 'bill_item_id',
  })
  public bill: BelongsTo<typeof Bill>;
}
