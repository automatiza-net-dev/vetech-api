import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';

export default class extends BaseSeeder {
  private BASE_CIRURGIA: Array<Partial<ScheduleServiceType>> = [
    {
      description: 'Avaliação Cirúrgica',
      allowReturn: true,
    },
    {
      description: 'Cirurgia',
      allowReturn: true,
    },
  ];

  private BASE_CONSULTAS: Array<Partial<ScheduleServiceType>> = [
    {
      description: 'Consulta Dermatológica',
      allowReturn: true,
    },
    {
      description: 'Consulta Emergência Rotina',
      allowReturn: true,
    },
    {
      description: 'Consulta Endocrinológica',
      allowReturn: true,
    },
    {
      description: 'Consulta Neurológica ( Dra Larissa)',
      allowReturn: true,
    },
    {
      description: 'Consulta Odontológica',
      allowReturn: true,
    },
    {
      description: 'Consulta Oftalmológica',
      allowReturn: true,
    },
    {
      description: 'Consulta Ortopédica',
      allowReturn: true,
    },
    {
      description: 'Consulta Plantão',
      allowReturn: true,
    },
    {
      description: 'Consulta Rotina',
      allowReturn: true,
    },
    {
      description: 'Consulta Rotina Felinos',
      allowReturn: true,
    },
    {
      description: 'Histórico do Sisvet',
      allowReturn: false,
    },
  ];

  private BASE_EXAMES: Array<Partial<ScheduleServiceType>> = [
    {
      description: 'Coleta de sangue',
      allowReturn: false,
    },
    {
      description: 'Coleta de sangue para transfusão',
      allowReturn: false,
    },
    {
      description: 'Coleta de urina guiada por Usg',
      allowReturn: false,
    },
    {
      description: 'Endoscopia/Colonoscopia',
      allowReturn: false,
    },
    {
      description: 'Raio-x externo',
      allowReturn: false,
    },
    {
      description: 'Ultrassom',
      allowReturn: false,
    },
    {
      description: 'Ultrassom Gestacional',
      allowReturn: false,
    },
  ];

  private BASE_INTERNACAO: Array<Partial<ScheduleServiceType>> = [
    {
      description: 'Alta',
      allowReturn: false,
    },
    {
      description: 'Encaminhamento - Receptivo',
      allowReturn: false,
    },
    {
      description: 'Internamento',
      allowReturn: false,
    },
    {
      description: 'Visita',
      allowReturn: false,
    },
  ];

  private BASE_PROCEDIMENTOS: Array<Partial<ScheduleServiceType>> = [
    {
      description: 'Curativo pós cirúrgico',
      allowReturn: false,
    },
    {
      description: 'Procedimento',
      allowReturn: false,
    },
    {
      description: 'Retirada de pontos',
      allowReturn: false,
    },
    {
      description: 'Vacinação',
      allowReturn: false,
    },
  ];

  private BASE_RETORNO: Array<Partial<ScheduleServiceType>> = [
    {
      description: 'Reavaliação',
      allowReturn: false,
    },
    {
      description: 'Relatório de raio-x',
      allowReturn: false,
    },
    {
      description: 'Retorno',
      allowReturn: false,
    },
  ];

  public async run() {
    const groups = await ScheduleServiceGroup.all();

    // CIRURGIA
    const cirurgia = groups.find(g => g.description === 'Cirurgia');
    if (!cirurgia) {
      throw new Error('Grupo Cirurgia não encontrado');
    }
    await cirurgia
      .related('types')
      .fetchOrCreateMany(this.BASE_CIRURGIA, 'description');

    // CONSULTAS
    const consultas = groups.find(g => g.description === 'Consultas');
    if (!consultas) {
      throw new Error('Grupo Consultas não encontrado');
    }
    await consultas
      .related('types')
      .fetchOrCreateMany(this.BASE_CONSULTAS, 'description');

    // EXAMES
    const exames = groups.find(g => g.description === 'Exames');
    if (!exames) {
      throw new Error('Grupo Exames não encontrado');
    }
    await exames
      .related('types')
      .fetchOrCreateMany(this.BASE_EXAMES, 'description');

    // INTERNAÇÃO
    const internacoes = groups.find(g => g.description === 'Internação');
    if (!internacoes) {
      throw new Error('Grupo Internação não encontrado');
    }
    await internacoes
      .related('types')
      .fetchOrCreateMany(this.BASE_INTERNACAO, 'description');

    // PROCEDIMENTOS
    const procedimentos = groups.find(g => g.description === 'Procedimentos');
    if (!procedimentos) {
      throw new Error('Grupo Procedimentos não encontrado');
    }
    await procedimentos
      .related('types')
      .fetchOrCreateMany(this.BASE_PROCEDIMENTOS, 'description');

    // RETORNOS
    const retorno = groups.find(g => g.description === 'Retorno');
    if (!retorno) {
      throw new Error('Grupo Retorno não encontrado');
    }
    await retorno
      .related('types')
      .fetchOrCreateMany(this.BASE_RETORNO, 'description');
  }
}
