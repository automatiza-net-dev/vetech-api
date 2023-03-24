import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import {
  FiscalDocumentMovementType,
  FiscalDocumentType,
} from 'App/Models/FiscalDocument';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum BusinessUnitFiscalDocumentMovementType {
  E = 'ENTRADA',
  S = 'SAIDA',
}

export const BusinessUnitFiscalDocumentFinality = {
  '1': 'NORMAL',
  '2': 'COMPLEMENTAR',
  '3': 'NOTA_DE_AJUSTE',
  '4': 'DEVOLUCAO',
} as const;

export default class BusinessUnitFiscalDocument extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column({
    columnName: 'document_type',
  })
  public documentType: FiscalDocumentType;

  @column({
    columnName: 'movement_type',
  })
  public movementType: FiscalDocumentMovementType;

  @column()
  description: string;

  @column()
  model: string;

  @column()
  series: string;

  @column()
  sequence: number;

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
  public fiscal_document_id: string;
}
