import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';

export default class extends BaseSeeder {
  private BASE_CIRURGIA: Array<Partial<ScheduleServiceType>> = [
    {
      description: 'Avaliação Cirúrgica',
      allowReturn: true,
      reservedMinutes: 45,
    },
    {
      description: 'Cirurgia',
      allowReturn: true,
      reservedMinutes: 120,
    },
  ];

  private BASE_CONSULTAS: Array<Partial<ScheduleServiceType>> = [
    {
      description: 'Consulta Dermatológica',
      allowReturn: true,
      reservedMinutes: 45,
    },
    {
      description: 'Consulta Emergência Rotina',
      allowReturn: true,
      reservedMinutes: 45,
    },
    {
      description: 'Consulta Endocrinológica',
      allowReturn: true,
      reservedMinutes: 45,
    },
    {
      description: 'Consulta Neurológica ( Dra Larissa)',
      allowReturn: true,
      reservedMinutes: 45,
    },
    {
      description: 'Consulta Odontológica',
      allowReturn: true,
      reservedMinutes: 45,
    },
    {
      description: 'Consulta Oftalmológica',
      allowReturn: true,
      reservedMinutes: 45,
    },
    {
      description: 'Consulta Ortopédica',
      allowReturn: true,
      reservedMinutes: 45,
    },
    {
      description: 'Consulta Plantão',
      allowReturn: true,
      reservedMinutes: 30,
    },
    {
      description: 'Consulta Rotina',
      allowReturn: true,
      reservedMinutes: 45,
    },
    {
      description: 'Consulta Rotina Felinos',
      allowReturn: true,
      reservedMinutes: 45,
    },
    {
      description: 'Histórico do Sisvet',
      allowReturn: false,
      reservedMinutes: 45,
    },
  ];

  private BASE_EXAMES: Array<Partial<ScheduleServiceType>> = [
    {
      description: 'Coleta de sangue',
      allowReturn: false,
      reservedMinutes: 30,
    },
    {
      description: 'Coleta de sangue para transfusão',
      allowReturn: false,
      reservedMinutes: 60,
    },
    {
      description: 'Coleta de urina guiada por Usg',
      allowReturn: false,
      reservedMinutes: 60,
    },
    {
      description: 'Endoscopia/Colonoscopia',
      allowReturn: false,
      reservedMinutes: 90,
    },
    {
      description: 'Raio-x externo',
      allowReturn: false,
      reservedMinutes: 45,
    },
    {
      description: 'Ultrassom',
      allowReturn: false,
      reservedMinutes: 30,
    },
    {
      description: 'Ultrassom Gestacional',
      allowReturn: false,
      reservedMinutes: 45,
    },
  ];

  private BASE_INTERNACAO: Array<Partial<ScheduleServiceType>> = [
    {
      description: 'Alta',
      allowReturn: false,
      reservedMinutes: 30,
    },
    {
      description: 'Encaminhamento - Receptivo',
      allowReturn: false,
      reservedMinutes: 20,
    },
    {
      description: 'Internamento',
      allowReturn: false,
      reservedMinutes: 30,
    },
    {
      description: 'Visita',
      allowReturn: false,
      reservedMinutes: 60,
    },
  ];

  private BASE_PROCEDIMENTOS: Array<Partial<ScheduleServiceType>> = [
    {
      description: 'Curativo pós cirúrgico',
      allowReturn: false,
      reservedMinutes: 30,
    },
    {
      description: 'Procedimento',
      allowReturn: false,
      reservedMinutes: 30,
    },
    {
      description: 'Retirada de pontos',
      allowReturn: false,
      reservedMinutes: 30,
    },
    {
      description: 'Vacinação',
      allowReturn: false,
      reservedMinutes: 30,
    },
  ];

  private BASE_RETORNO: Array<Partial<ScheduleServiceType>> = [
    {
      description: 'Reavaliação',
      allowReturn: false,
      reservedMinutes: 45,
    },
    {
      description: 'Relatório de raio-x',
      allowReturn: false,
      reservedMinutes: 45,
    },
    {
      description: 'Retorno',
      allowReturn: false,
      reservedMinutes: 45,
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
