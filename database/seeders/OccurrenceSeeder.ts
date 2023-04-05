import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Occurrence, { OccurrenceType } from 'App/Models/Occurrence';

export default class extends BaseSeeder {
  BASE: Record<OccurrenceType, Partial<Occurrence>> = {
    [OccurrenceType.PESO]: {
      description: 'Peso',
      type: OccurrenceType.PESO,
      active: true,
    },
    [OccurrenceType.ADMISSAO_INTERNACAO]: {
      description: 'Admissão em Internação',
      type: OccurrenceType.ADMISSAO_INTERNACAO,
      active: true,
    },
    [OccurrenceType.ALTA_INTERNACAO]: {
      description: 'Alta de Internação',
      type: OccurrenceType.ALTA_INTERNACAO,
      active: true,
    },
    [OccurrenceType.ADMISSAO_OBSERVACAO]: {
      description: 'Admissão em Observação',
      type: OccurrenceType.ADMISSAO_OBSERVACAO,
      active: true,
    },
    [OccurrenceType.ALTA_OBSERVACAO]: {
      description: 'Alta de Observação',
      type: OccurrenceType.ALTA_OBSERVACAO,
      active: true,
    },
    [OccurrenceType.ADMISSAO_UTI]: {
      description: 'Admissão em UTI',
      type: OccurrenceType.ADMISSAO_UTI,
      active: true,
    },
    [OccurrenceType.ALTA_UTI]: {
      description: 'Alta de UTI',
      type: OccurrenceType.ALTA_UTI,
      active: true,
    },
    [OccurrenceType.PRESCRICAO_MEDICA]: {
      description: 'Procedimento Médico',
      type: OccurrenceType.PRESCRICAO_MEDICA,
      active: true,
    },
    [OccurrenceType.MEDICACAO]: {
      description: 'Medicação',
      type: OccurrenceType.MEDICACAO,
      active: true,
    },
    [OccurrenceType.FLUIDOTERAPIA]: {
      description: 'Fluidoterapia',
      type: OccurrenceType.FLUIDOTERAPIA,
      active: true,
    },
    [OccurrenceType.OBITO]: {
      description: 'Óbito',
      type: OccurrenceType.OBITO,
      active: true,
    },
    [OccurrenceType.OCORRENCIA]: {
      description: 'Ocorrência',
      type: OccurrenceType.OCORRENCIA,
      active: true,
    },
    [OccurrenceType.RELATORIO_MEDICO]: {
      description: 'Relatório Médico',
      type: OccurrenceType.RELATORIO_MEDICO,
      active: true,
    },
  };

  public async run() {
    await Occurrence.fetchOrCreateMany('type', Object.values(this.BASE));
  }
}
