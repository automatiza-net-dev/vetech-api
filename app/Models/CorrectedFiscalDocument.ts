import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export default class CorrectedFiscalDocument extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column.dateTime({
    columnName: 'corrected_date',
  })
  public correctedDate: DateTime;

  @column()
  public protocol: string;

  @column.dateTime({
    columnName: 'protocol_date',
  })
  public protocolDate: DateTime;

  @column()
  public description: string;

  @column()
  public active: boolean;

  //
  @column({
    columnName: 'correction_number',
  })
  correctionNumber: string;

  @column({
    columnName: 'correction_xml_path',
  })
  correctionXmlPath: string;

  @column({
    columnName: 'correction_pdf_path',
  })
  correctionPdfPath: string;

  // timestamps
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
  public user_id: string;

  @column({
    serializeAs: null,
  })
  public fiscal_document_id: string;
}
