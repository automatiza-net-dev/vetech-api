import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum FiscalDocumentType {
  P = 'PRODUTOS',
  S = 'SERVICOS',
}

export enum FiscalDocumentMovementType {
  A = 'AMBOS',
  S = 'SAIDA',
  E = 'ENTRADA',
}

export default class FiscalDocument extends BaseModel {
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

  @column({
    columnName: 'image_name',
  })
  public imageName: string;

  @column()
  description: string;

  @column()
  model: string;

  @column()
  active: boolean;

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime;
}
