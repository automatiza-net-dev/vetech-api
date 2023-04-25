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
  PRESCRICAO_MEDICA = 'PM',
  MEDICACAO = 'M',
  FLUIDOTERAPIA = 'F',
  OBITO = 'OB',
  OCORRENCIA = 'OC',
  RELATORIO_MEDICO = 'RM',
}

export const OccurrenceTypeLabels: Record<OccurrenceType, string> = {
  [OccurrenceType.PESO]: 'Peso',
  [OccurrenceType.ADMISSAO_INTERNACAO]: 'Admissão Internção',
  [OccurrenceType.ALTA_INTERNACAO]: 'Alta Internação',
  [OccurrenceType.ADMISSAO_OBSERVACAO]: 'Admissão Observação',
  [OccurrenceType.ALTA_OBSERVACAO]: 'Alta Observação',
  [OccurrenceType.ADMISSAO_UTI]: 'Admissão UTI',
  [OccurrenceType.ALTA_UTI]: 'Alta URI',
  [OccurrenceType.PRESCRICAO_MEDICA]: 'Prescrição Médica',
  [OccurrenceType.MEDICACAO]: 'Medicação',
  [OccurrenceType.FLUIDOTERAPIA]: 'Fluidoterapia',
  [OccurrenceType.OBITO]: 'Óbito',
  [OccurrenceType.OCORRENCIA]: 'Ocorrência',
  [OccurrenceType.RELATORIO_MEDICO]: 'Relatório Médico',
};

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
  public system_id: number;

  @column({
    serializeAs: null,
  })
  public economic_group_id?: string;
}
