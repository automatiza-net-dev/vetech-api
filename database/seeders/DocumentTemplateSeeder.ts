import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import DocumentTemplate from 'App/Models/DocumentTemplate';

export default class extends BaseSeeder {
  BASE = [
    {
      title: '1 - TERMO CONFORME LEI GERAL DE PROTEÇÃO DE DADOS (LGPD)',
      description: '1 - TERMO CONFORME LEI GERAL DE PROTEÇÃO DE DADOS (LGPD)',
    },
    {
      title: '1.2 - CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
      description: '1.2 - CONTRATO DE PRESTAÇÃO DE SERVIÇOS',
    },
    {
      title: '1.3 - TERMO DE AUTORIZAÇÃO PARA APLICACÃO DE VACINAS',
      description: '1.3 - TERMO DE AUTORIZAÇÃO PARA APLICACÃO DE VACINAS',
    },
    {
      title:
        '10 - TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA RELATO DE CASO - ESTUDO DE CASO',
      description:
        '10 - TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO PARA RELATO DE CASO - ESTUDO DE CASO',
    },
    {
      title: '2 - CONTRATO DE AUTORIZAÇÃO PARA INTERNAÇÃO',
      description: '2 - CONTRATO DE AUTORIZAÇÃO PARA INTERNAÇÃO',
    },
    {
      title: '3 - CONTRATO DE AUTORIZAÇÃO PARA ANESTESIA E CIRURGIA',
      description: '3 - CONTRATO DE AUTORIZAÇÃO PARA ANESTESIA E CIRURGIA',
    },
    {
      title:
        '3.1 - CONTRATO DE AUTORIZAÇÃO PARA SEDAÇÃO/ANESTESIA PARA EXAME/PROCEDIMENTO',
      description:
        '3.1 - CONTRATO DE AUTORIZAÇÃO PARA SEDAÇÃO/ANESTESIA PARA EXAME/PROCEDIMENTO',
    },
    {
      title: '4 - CONTRATO DE AUTORIZAÇÃO PARA ENDOSCOPIA/COLONOSCOPIA',
      description: '4 - CONTRATO DE AUTORIZAÇÃO PARA ENDOSCOPIA/COLONOSCOPIA',
    },
    {
      title: '5 - TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM',
      description: '5 - TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM',
    },
    {
      title: '6 - TERMO DE AUTORIZAÇÃO PARA EUTANÁSIA MÉDICA VETERINÁRIA',
      description: '6 - TERMO DE AUTORIZAÇÃO PARA EUTANÁSIA MÉDICA VETERINÁRIA',
    },
    {
      title:
        '8 - TERMO DE NÃO AUTORIZAÇÃO DE EXAMES COMPLEMENTARES/PROCEDIMENTO',
      description:
        '8 - TERMO DE NÃO AUTORIZAÇÃO DE EXAMES COMPLEMENTARES/PROCEDIMENTO',
    },
    {
      title:
        '8.1 - TERMO DE RETIRADA DE ANIMAL DO SERVIÇO VETERINÁRIO-INTERNAMENTO SEM ALTA MÉDICA',
      description:
        '8.1 - TERMO DE RETIRADA DE ANIMAL DO SERVIÇO VETERINÁRIO-INTERNAMENTO SEM ALTA MÉDICA',
    },
    {
      title: '9 - TERMO DE AUTORIZAÇÃO PARA DESTINAÇÃO DO PACIENTE',
      description: '9 - TERMO DE AUTORIZAÇÃO PARA DESTINAÇÃO DO PACIENTE',
    },
    {
      title: 'Atestado de óbito',
      description: 'Atestado de óbito',
    },
    {
      title: 'Atestado de saúde',
      description: 'Atestado de saúde',
    },
    {
      title: 'Atestado de vacinação',
      description: 'Atestado de vacinação',
    },
    {
      title: 'Atestado de viagem MAPA',
      description: 'Atestado de viagem MAPA',
    },
    {
      title: 'Atestado de viagem mapa (imagem)',
      description: 'Atestado de viagem mapa (imagem)',
    },
    {
      title: 'Autorização para transfusão com incompatibilidade sanguínea',
      description:
        'Autorização para transfusão com incompatibilidade sanguínea',
    },
    {
      title: 'Boletim Médico - internação',
      description: 'Boletim Médico - internação',
    },
    {
      title: 'Certificado de microchipagem',
      description: 'Certificado de microchipagem',
    },
    {
      title: 'Contrato de prestação de serviços',
      description: 'Contrato de prestação de serviços',
    },
    {
      title:
        'Declaração de comparecimento de tutor para atendimento veterinário',
      description:
        'Declaração de comparecimento de tutor para atendimento veterinário',
    },
    {
      title: 'Descrição cirurgias para prontuário',
      description: 'Descrição cirurgias para prontuário',
    },
    {
      title: 'Descritivo de cirurgia',
      description: 'Descritivo de cirurgia',
    },
    {
      title: 'Encaminhamento',
      description: 'Encaminhamento',
    },
    {
      title: 'Exame radiográfico',
      description: 'Exame radiográfico',
    },
    {
      title: 'Exame ultrassonográfico - felino',
      description: 'Exame ultrassonográfico - felino',
    },
    {
      title: 'Exame ultrassonográfico - fêmea',
      description: 'Exame ultrassonográfico - fêmea',
    },
    {
      title: 'Exame ultrassonográfico - gestacional',
      description: 'Exame ultrassonográfico - gestacional',
    },
    {
      title: 'Exame ultrassonográfico - macho',
      description: 'Exame ultrassonográfico - macho',
    },
    {
      title: 'Ficha Resumida',
      description: 'Ficha Resumida',
    },
    {
      title: 'Guia de trânsito',
      description: 'Guia de trânsito',
    },
    {
      title: 'Laudo Snap-test 4dx',
      description: 'Laudo Snap-test 4dx',
    },
    {
      title: 'Laudo Snap-test FIV/Felv Combo',
      description: 'Laudo Snap-test FIV/Felv Combo',
    },
    {
      title: 'Laudo Snap-test Giardia',
      description: 'Laudo Snap-test Giardia',
    },
    {
      title: 'Laudo teste rápido Cinomose',
      description: 'Laudo teste rápido Cinomose',
    },
    {
      title: 'Laudo teste rápido Parvovirose',
      description: 'Laudo teste rápido Parvovirose',
    },
    {
      title: 'Neopet - Contrato de prestação de serviços',
      description: 'Neopet - Contrato de prestação de serviços',
    },
    {
      title: 'Neopet - Recomendações Pós-quimioterapia',
      description: 'Neopet - Recomendações Pós-quimioterapia',
    },
    {
      title: 'Neopet - Termo de autorização para quimioterapia',
      description: 'Neopet - Termo de autorização para quimioterapia',
    },
    {
      title: 'Orientação pós profilaxia dentária',
      description: 'Orientação pós profilaxia dentária',
    },
    {
      title: 'Parto assistido/casa',
      description: 'Parto assistido/casa',
    },
    {
      title: 'Procotolo de entrega de prontuário médico',
      description: 'Procotolo de entrega de prontuário médico',
    },
    {
      title: 'Protocolo Anestésico',
      description: 'Protocolo Anestésico',
    },
    {
      title: 'Receituário de Controle Especial',
      description: 'Receituário de Controle Especial',
    },
    {
      title: 'Relatório Médico de atendimento',
      description: 'Relatório Médico de atendimento',
    },
    {
      title: 'Resultado aferição de pressão ambulatorial',
      description: 'Resultado aferição de pressão ambulatorial',
    },
    {
      title: 'Solicitação de Exame',
      description: 'Solicitação de Exame',
    },
    {
      title: 'Termo de Autorização para Anestesia e Cirurgia',
      description: 'Termo de Autorização para Anestesia e Cirurgia',
    },
    {
      title: 'Termo de Autorização para Exames',
      description: 'Termo de Autorização para Exames',
    },
    {
      title: 'Termo de Autorização para Internação',
      description: 'Termo de Autorização para Internação',
    },
    {
      title: 'Termo de Autorização para Procedimento Terapêutico',
      description: 'Termo de Autorização para Procedimento Terapêutico',
    },
    {
      title:
        'TERMO DE ENTRADA DE ATENDIMENTO DA SANTA CLARA SAÚDE ANIMAL (CMI PET SHOP LTDA)',
      description:
        'TERMO DE ENTRADA DE ATENDIMENTO DA SANTA CLARA SAÚDE ANIMAL (CMI PET SHOP LTDA)',
    },
    {
      title: 'Termo de Recusa de exame',
      description: 'Termo de Recusa de exame',
    },
  ];

  public async run() {
    await DocumentTemplate.fetchOrCreateMany(
      'description',
      this.BASE.map(elem => ({
        ...elem,
        template: '',
      })),
    );
  }
}
