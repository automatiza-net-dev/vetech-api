import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import DocumentTemplate from 'App/Models/DocumentTemplate';

export default class extends BaseSeeder {
  BASE = [
    {
      title: '1.2 - CONTRATO DE PRESTAÇÃO DE SERVIÇOS + LGPD',
    },
    {
      title: '1.3 - TERMO DE AUTORIZAÇÃO PARA APLICACÃO DE VACINAS + LGPD',
    },
    {
      title: '2 - CONTRATO DE AUTORIZAÇÃO PARA INTERNAÇÃO + LGPD',
    },
    {
      title: '3 - CONTRATO DE AUTORIZAÇÃO PARA ANESTESIA E CIRURGIA + LGPD',
    },
    {
      title:
        '3.1 - CONTRATO DE AUTORIZAÇÃO PARA SEDAÇÃO/ANESTESIA PARA EXAME/PROCEDIMENTO + LGPD',
    },
    {
      title: '4 - CONTRATO DE AUTORIZAÇÃO PARA ENDOSCOPIA/COLONOSCOPIA + LGPD',
    },
    {
      title: '5 - TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM',
    },
    {
      title: '6 - TERMO DE AUTORIZAÇÃO PARA EUTANÁSIA MÉDICA VETERINÁRIA',
    },
    {
      title:
        '8 - TERMO DE NÃO AUTORIZAÇÃO DE EXAMES COMPLEMENTARES/PROCEDIMENTO',
    },
    {
      title:
        '8.1 - TERMO DE RETIRADA DE ANIMAL DO SERVIÇO VETERINÁRIO-INTERNAMENTO SEM ALTA MÉDICA',
    },
    {
      title: '9 - TERMO DE AUTORIZAÇÃO PARA DESTINAÇÃO DO PACIENTE PÓS ÓBITO',
    },
    {
      title: 'Atestado de óbito',
    },
    {
      title: 'Atestado de saúde',
    },
    {
      title: 'Atestado de vacinação',
    },
    {
      title: 'Atestado de viagem MAPA',
    },
    {
      title: 'Boletim Médico - internação',
    },
    {
      title: 'Certificado de microchipagem',
    },
    {
      title:
        'Declaração de comparecimento de tutor para atendimento veterinário',
    },
    {
      title: 'Descrição cirurgias para prontuário',
    },
    {
      title: 'Encaminhamento',
    },
    {
      title: 'Ficha Resumida',
    },
    {
      title: 'Guia de trânsito',
    },
    {
      title: 'Laudo Snap-test 4dx',
    },
    {
      title: 'Laudo Snap-test FIV/Felv Combo',
    },
    {
      title: 'Laudo Snap-test Giardia',
    },
    {
      title: 'Laudo teste rápido Cinomose',
    },
    {
      title: 'Laudo teste rápido Parvovirose',
    },
    {
      title: 'Parto assistido/casa',
    },
    {
      title: 'Procotolo de entrega de prontuário médico',
    },
    {
      title: 'Receituário de Controle Especial',
    },
    {
      title: 'Relatório Médico de atendimento',
    },
    {
      title: 'Resultado aferição de pressão ambulatorial',
    },
    {
      title: 'TERMO CONFORME LEI GERAL DE PROTEÇÃO DE DADOS (LGPD)',
    },
    {
      title:
        'TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA RELATO DE CASO - ESTUDO DE CASO',
    },
  ];

  public async run() {
    await DocumentTemplate.fetchOrCreateMany(
      'description',
      this.BASE.map(elem => ({
        title: elem.title,
        description: elem.title,
        template: '',
      })),
    );
  }
}
