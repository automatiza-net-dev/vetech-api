import {
  BaseModel,
  beforeFetch,
  beforeFind,
  column,
} from '@ioc:Adonis/Lucid/Orm';
import { softDelete, softDeleteQuery } from 'App/Services/SoftDelete';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

export enum OccurrenceType {
  PESO = 'P',
  ADMISSAO_INTERNACAO = 'I',
  ALTA_INTERNACAO = 'AI',
  ADMISSAO_OBSERVACAO = 'O',
  ALTA_OBSERVACAO = 'AO',
  ADMISSAO_UTI = 'U',
  ALTA_UTI = 'AU',
  PROCEDIMENTO_CLINICO = 'PC',
  MEDICACAO = 'M',
  FLUIDOTERAPIA = 'F',
  OBITO = 'OB',
}

export default class Occurrence extends BaseModel {
  @column({ isPrimary: true })
  public id: string = v4();

  @column()
  public description: string;

  @column()
  public type: OccurrenceType;

  @column()
  public active: boolean;

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
  public economic_group_id?: string;
}
