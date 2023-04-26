import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import { AccountPlanType } from 'App/Models/AccountPlan';
import AccountPlanGroup, {
  AccountPlanGroupType,
} from 'App/Models/AccountPlanGroup';
import Brand from 'App/Models/Brand';
import ClientOrigin, { ClientOriginType } from 'App/Models/ClientOrigin';
import DocumentTemplate from 'App/Models/DocumentTemplate';
import DrugAdministration from 'App/Models/DrugAdministration';
import MedicalDocumentTemplate from 'App/Models/MedicalDocumentTemplate';
import Pathology from 'App/Models/Pathology';
import PaymentMethod, {
  PaymentMethodTef,
  PaymentMethodType,
  PaymentMethodUsage,
} from 'App/Models/PaymentMethod';
import ScheduleServiceGroup, {
  ScheduleServiceGroupType,
} from 'App/Models/ScheduleServiceGroup';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import ScheduleStatus from 'App/Models/ScheduleStatus';
import Subgroup from 'App/Models/Subgroup';
import System from 'App/Models/System';
import TemplateReplacement, {
  TemplateReplacementOrigin,
} from 'App/Models/TemplateReplacement';
import Unit, { UnitType } from 'App/Models/Unit';

export default class extends BaseSeeder {
  public async run() {
    const lift = await System.query().where('name', 'LiftOne').firstOrFail();

    Pathology.fetchOrCreateMany(
      ['description', 'system_id'],
      [
        {
          description: 'Diabetes',
          definition: 'Diabetes',
          template: '',
          system_id: lift.id,
          active: true,
        },
      ],
    );

    await Brand.fetchOrCreateMany(
      ['description', 'system_id'],
      [
        {
          description: 'LiftOne',
          system_id: lift.id,
        },
      ],
    );

    await Subgroup.fetchOrCreateMany(
      'description',
      [
        'Anestesias',
        'Cirurgias Eletiva',
        'Cirurgias Terapêutica',
        'Consultas',
        'Exames em Geral',
        'Procedimentos',
        'Dermocosméticos',
      ].map(elem => ({
        description: elem,
      })),
    );

    const groups = await ScheduleServiceGroup.fetchOrCreateMany(
      ['description', 'system_id'],
      [
        'Internação',
        'Cirurgia',
        'Exames',
        'Consultas',
        'Procedimentos',
        'Retorno',
      ].map(elem => ({
        description: elem,
        system_id: lift.id,
        type: ScheduleServiceGroupType.R,
      })),
    );

    await ScheduleServiceType.fetchOrCreateMany(
      ['description', 'system_id'],
      [
        {
          description: 'Procedimento facial',
          group: 'Cirurgia',
          minutes: 60,
          allow: true,
        },
        {
          description: 'Avaliação',
          group: 'Consultas',
          minutes: 45,
          allow: true,
        },
        {
          description: 'Curativo pós cirúrgico',
          group: 'Procedimentos',
          minutes: 30,
          allow: false,
        },
        {
          description: 'Retirada de pontos',
          group: 'Procedimentos',
          minutes: 30,
          allow: false,
        },
        { description: 'Retorno', group: 'Retorno', minutes: 30, allow: false },
      ].map(elem => {
        const group = groups.find(g => g.description === elem.group);

        return {
          schedule_service_group_id: group?.id,
          description: elem.description,
          allowReturn: elem.allow,
          reservedMinutes: elem.minutes,
          system_id: lift.id,
        };
      }),
    );

    await ScheduleStatus.fetchOrCreateMany(
      ['description', 'system_id'],
      [
        {
          description: 'Agendado (Não confirmado)',
          color: '#D3D3D3',
          system_id: lift.id,
        },
        {
          description: 'Agendado (Confirmado)',
          color: '#00BFFF',
          system_id: lift.id,
        },
        {
          description: 'Na recepção',
          color: '#FFA500',
          system_id: lift.id,
        },
        {
          description: 'Em atendimento',
          color: '#1E90FF',
          system_id: lift.id,
        },
        {
          description: 'Atendimento finalizado',
          color: '#008000',
          system_id: lift.id,
        },
        {
          description: 'Atendimento cancelado',
          color: '#4F4F4F',
          system_id: lift.id,
        },
        {
          description: 'Em cirurgia',
          color: '#DEB887',
          system_id: lift.id,
        },
        {
          description: 'Hospitalizado',
          color: '#FFD700',
          system_id: lift.id,
        },
        {
          description: 'Em observação',
          color: '#FFFF00',
          system_id: lift.id,
        },
        {
          description: 'Atrasado',
          color: '#FF0000',
          system_id: lift.id,
        },
      ],
    );

    await DrugAdministration.fetchOrCreateMany(
      ['description', 'system_id'],
      [
        'Enema',
        'Epidural',
        'Inalatória',
        'Intramuscular',
        'Intraóssea',
        'Intraperitoneal',
        'Intravenosa',
        'Oftálmica',
        'Oral',
        'Otológica',
        'Sonda',
        'Subcutânea',
        'Tópica',
      ].map(elem => ({
        description: elem,
        system_id: lift.id,
      })),
    );

    await Unit.fetchOrCreateMany(
      ['name', 'system_id'],
      [
        { name: 'Caixa', tag: 'cx', type: UnitType.PRODUCT },
        { name: 'Pacote', tag: 'pac', type: UnitType.PRODUCT },
        { name: 'Par', tag: 'par', type: UnitType.PRODUCT },
        { name: 'Peça', tag: 'pc', type: UnitType.PRODUCT },
        { name: 'Rolo', tag: 'rl', type: UnitType.PRODUCT },
        { name: 'Quilo', tag: 'kg', type: UnitType.PRODUCT },
        { name: 'Saco', tag: 'sc', type: UnitType.PRODUCT },
        { name: 'Unidade', tag: 'un', type: UnitType.PRODUCT },

        { name: 'Ampola', tag: 'amp', type: UnitType.MEDICINE },
        { name: 'Borrifada', tag: 'borrifada', type: UnitType.MEDICINE },
        { name: 'Cartela', tag: 'cart', type: UnitType.MEDICINE },
        { name: 'Comprimido', tag: 'comprimido', type: UnitType.MEDICINE },
        { name: 'Drágeas', tag: 'drágeas', type: UnitType.MEDICINE },
        { name: 'Frasco', tag: 'fr', type: UnitType.MEDICINE },
        { name: 'Gotas', tag: 'gotas', type: UnitType.MEDICINE },
        { name: 'Gotas por Quilo', tag: 'gotas/kg', type: UnitType.MEDICINE },
        { name: 'Grama', tag: 'gr', type: UnitType.MEDICINE },
        {
          name: 'Micrograma por Quilo',
          tag: 'mcg/kg',
          type: UnitType.MEDICINE,
        },
        { name: 'Miligrama', tag: 'mg', type: UnitType.MEDICINE },
        { name: 'Miligramas por Quilo', tag: 'mg/kg', type: UnitType.MEDICINE },
        { name: 'Mililitro', tag: 'ml', type: UnitType.MEDICINE },
        { name: 'Mililitros por Quilo', tag: 'ml/kg', type: UnitType.MEDICINE },
        { name: 'UI por Mililitro', tag: 'ui/ml', type: UnitType.MEDICINE },
        { name: 'UI por Quilo', tag: 'ui/kg', type: UnitType.MEDICINE },

        {
          name: 'Gotas por Minuto',
          tag: 'gotas/min',
          type: UnitType.FLUID_VELOCITY,
        },
        {
          name: 'Mililitros por Dia',
          tag: 'ml/dia',
          type: UnitType.FLUID_VELOCITY,
        },
        {
          name: 'Mililitros por Hora',
          tag: 'ml/h',
          type: UnitType.FLUID_VELOCITY,
        },
      ].map(elem => ({
        ...elem,
        system_id: lift.id,
      })),
    );

    await PaymentMethod.fetchOrCreateMany('description', [
      {
        description: 'Boleto Bancario',
        requiresDocument: false,
        tef: PaymentMethodTef.N,
        fee: 0,
        usage: PaymentMethodUsage.ENTRADA,
        nfe_code: '15',
      },
      {
        description: 'PIX',
        requiresDocument: false,
        tef: PaymentMethodTef.N,
        fee: 0,
        usage: PaymentMethodUsage.AMBOS,
        nfe_code: '17',
      },
      {
        description: 'Transferência Bancaria',
        requiresDocument: false,
        tef: PaymentMethodTef.N,
        fee: 0,
        usage: PaymentMethodUsage.AMBOS,
        nfe_code: '18',
      },
      {
        description: 'Cheque',
        requiresDocument: false,
        tef: PaymentMethodTef.N,
        fee: 0,
        usage: PaymentMethodUsage.ENTRADA,
        nfe_code: '02',
      },
      {
        description: 'Dinheiro',
        requiresDocument: false,
        tef: PaymentMethodTef.N,
        fee: 0,
        usage: PaymentMethodUsage.AMBOS,
        nfe_code: '01',
      },
      {
        description: 'Débito em Conta',
        requiresDocument: false,
        tef: PaymentMethodTef.N,
        fee: 0,
        usage: PaymentMethodUsage.ENTRADA,
        nfe_code: '99',
      },
      {
        description: 'Crédito Devolução',
        requiresDocument: true,
        tef: PaymentMethodTef.N,
        fee: 0,
        usage: PaymentMethodUsage.SAIDA,
        nfe_code: '05',
      },
      {
        description: 'Cartão de Débito (POS)',
        requiresDocument: true,
        tef: PaymentMethodTef.P,
        type: PaymentMethodType.D,
        fee: 0,
        usage: PaymentMethodUsage.AMBOS,
        nfe_code: '04',
      },
      {
        description: 'Cartão de Crédito (POS)',
        requiresDocument: true,
        tef: PaymentMethodTef.P,
        type: PaymentMethodType.C,
        fee: 0,
        usage: PaymentMethodUsage.AMBOS,
        nfe_code: '03',
      },
    ]);

    await MedicalDocumentTemplate.fetchOrCreateMany(
      ['title', 'system_id'],
      [
        {
          title: 'Orientação pré cirurgia',
          description: 'Orientação pré cirurgia',
          template: '',
          header: '',
          system_id: lift.id,
        },
        {
          title: 'Recomendações pós cirurgia',
          description: 'Recomendações pós cirurgia',
          template: '',
          header: '',
          system_id: lift.id,
        },
        {
          title: 'Receita Geral',
          description: 'Receita Geral',
          template: '',
          header: '',
          system_id: lift.id,
        },
        {
          title: 'Receita Pós cirurgia',
          description: 'Receita Pós cirurgia',
          template: '',
          header: '',
          system_id: lift.id,
        },
      ],
    );

    await DocumentTemplate.fetchOrCreateMany(
      ['title', 'system_id'],
      [
        {
          title: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS + LGPD',
          description: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS + LGPD',
          template: '',
          header: '',
          system_id: lift.id,
        },
        {
          title: 'CONTRATO DE AUTORIZAÇÃO PARA ANESTESIA E CIRURGIA + LGPD',
          description:
            'CONTRATO DE AUTORIZAÇÃO PARA ANESTESIA E CIRURGIA + LGPD',
          template: '',
          header: '',
          system_id: lift.id,
        },
        {
          title: 'TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM',
          description: 'TERMO DE AUTORIZAÇÃO DE USO DE IMAGEM',
          template: '',
          header: '',
          system_id: lift.id,
        },
        {
          title: 'Descrição cirurgias para prontuário',
          description: 'Descrição cirurgias para prontuário',
          template: '',
          header: '',
          system_id: lift.id,
        },
        {
          title: 'Procotolo de entrega de prontuário médico',
          description: 'Procotolo de entrega de prontuário médico',
          template: '',
          header: '',
          system_id: lift.id,
        },
        {
          title: 'Relatório Médico de atendimento',
          description: 'Relatório Médico de atendimento',
          template: '',
          header: '',
          system_id: lift.id,
        },
      ],
    );

    await ClientOrigin.fetchOrCreateMany(
      ['description', 'system_id'],
      [
        'Facebook',
        'Google',
        'Indicação de amigo',
        'Indicação de colega',
        'Instagram',
        'Panfletagem',
        'Passando na rua',
        'Radio',
        'Televisão',
      ].map(elem => ({
        description: elem,
        system_id: lift.id,
        type: ClientOriginType.C,
      })),
    );

    const accountPlanGroups = await AccountPlanGroup.fetchOrCreateMany(
      ['description', 'system_id'],
      [
        {
          description: 'RECEITAS',
          type: AccountPlanGroupType.C,
          system_id: lift.id,
        },
        {
          description: 'DEDUÇÕES',
          type: AccountPlanGroupType.D,
          system_id: lift.id,
        },
        {
          description: 'CUSTOS VARIAVEIS',
          type: AccountPlanGroupType.D,
          system_id: lift.id,
        },
        {
          description: 'CUSTOS FIXOS',
          type: AccountPlanGroupType.D,
          system_id: lift.id,
        },
        {
          description: 'RESULTADO FINANCEIRO',
          type: AccountPlanGroupType.A,
          system_id: lift.id,
        },
        {
          description: 'EXTRA OPERACIONAL',
          type: AccountPlanGroupType.A,
          system_id: lift.id,
        },
      ],
    );

    // ----------------------------------------
    const receiptPlanGroup = accountPlanGroups.find(
      accountPlanGroup => accountPlanGroup.description === 'RECEITAS',
    );
    if (!receiptPlanGroup) {
      throw new Error('RECEITAS not found');
    }
    await receiptPlanGroup.related('accountPlans').fetchOrCreateMany(
      [
        {
          description: 'Receita de produtos',
          code: '',
          type: AccountPlanType.C,
          system_id: lift.id,
        },
        {
          description: 'Receita de serviços',
          code: '',
          type: AccountPlanType.C,
          system_id: lift.id,
        },
      ],
      ['description', 'system_id'],
    );

    // ----------------------------------------
    const deductionsPlanGroup = accountPlanGroups.find(
      accountPlanGroup => accountPlanGroup.description === 'DEDUÇÕES',
    );
    if (!deductionsPlanGroup) {
      throw new Error('DEDUÇÕES not found');
    }
    const [d_first, d_second] = await deductionsPlanGroup
      .related('accountPlans')
      .fetchOrCreateMany(
        [
          {
            description: 'Devoluções e Cancelamentos',
            code: '',
            type: AccountPlanType.D,
          },
          {
            description: 'Impostos',
            code: '',
            type: AccountPlanType.D,
            system_id: lift.id,
          },
        ],
        ['description', 'system_id'],
      );
    await d_first.related('children').fetchOrCreateMany(
      [
        'Cheques Devolvidos',
        'Créditos Perdidos',
        'Devoluções a Clientes',
        'Cancelamento de Vendas',
      ].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.D,
          system_id: lift.id,
        }),
        ['description', 'system_id'],
      ),
    );
    await d_second.related('children').fetchOrCreateMany(
      [
        'Darf Cofins',
        'Darf Pis',
        'Das Simples Nacional',
        'Issqn Prefeitura',
      ].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.D,
          system_id: lift.id,
        }),
        ['description', 'system_id'],
      ),
    );

    // ----------------------------------------
    const variableCostsPlanGroup = accountPlanGroups.find(
      accountPlanGroup => accountPlanGroup.description === 'CUSTOS VARIAVEIS',
    );
    if (!variableCostsPlanGroup) {
      throw new Error('CUSTOS VARIAVEIS not found');
    }
    const [fc_first, fc_second, fc_third] = await variableCostsPlanGroup
      .related('accountPlans')
      .fetchOrCreateMany(
        [
          'Custos Dos Materiais',
          'Custos Da Mão-de-obra Direta',
          'Despesas Comerciais',
        ].map(
          elem => ({
            description: elem,
            code: '',
            type: AccountPlanType.D,
            system_id: lift.id,
          }),
          ['description', 'system_id'],
        ),
      );
    await fc_first.related('children').fetchOrCreateMany(
      [
        'Compras De Materiais (consumo)',
        'Compras De Materiais (revenda)',
        'Exames - Laboratório',
        'Fretes Sobre Compras',
      ].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.D,
          system_id: lift.id,
        }),
        ['description', 'system_id'],
      ),
    );
    await fc_second.related('children').fetchOrCreateMany(
      ['Salários Dos Veterinários'].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.D,
          system_id: lift.id,
        }),
        ['description', 'system_id'],
      ),
    );
    await fc_third.related('children').fetchOrCreateMany(
      [
        'Bonificação',
        'Fundo Nacional de Propaganda',
        'Marketing E Propaganda',
        'Royalties',
      ].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.D,
          system_id: lift.id,
        }),
        ['description', 'system_id'],
      ),
    );

    // ----------------------------------------
    const fixedCostsPlanGroup = accountPlanGroups.find(
      accountPlanGroup => accountPlanGroup.description === 'CUSTOS FIXOS',
    );
    if (!fixedCostsPlanGroup) {
      throw new Error('CUSTOS FIXOS not found');
    }
    const [ff_first, ff_second, ff_third, ff_fourth] = await fixedCostsPlanGroup
      .related('accountPlans')
      .fetchOrCreateMany(
        [
          'Despesas Administrativas',
          'Despesas Com Pessoal',
          'Gastos Gerais Nos Serviços',
          'Despesas Tributárias',
        ].map(
          elem => ({
            description: elem,
            code: '',
            type: AccountPlanType.D,
            system_id: lift.id,
          }),
          ['description', 'system_id'],
        ),
      );
    await ff_first.related('children').fetchOrCreateMany(
      [
        'Aluguel',
        'Brindes / Prêmios',
        'Cartórios E Protestos',
        'Confraternizações',
        'Consultorias',
        'Contador',
        'Estacionamento',
        'Correio',
        'Honorários De Advogados',
        'Impressos E Materiais Gráficos',
        'Internet / Telefone Fixo',
        'Telefone Celular',
        'Lanches E Refeições',
        'Manutenção De Instalações',
        'Material De Consumo',
        'Material De Escritório',
        'Material De Limpeza',
        'Mensalidade De Software',
        'Monitoramento E Segurança',
        'Pró-labore Dos Sócios',
        'Seguros',
        'Serasa /scpc /associação Comercial / CRMV',
        'Serviços De Terceiros',
      ].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.D,
          system_id: lift.id,
        }),
        ['description', 'system_id'],
      ),
    );
    await ff_second.related('children').fetchOrCreateMany(
      [
        '13 Salario',
        'Cursos E Treinamentos',
        'Exame Ocupacional',
        'Férias',
        'Gps Inss',
        'Plano De Saúde',
        'Prêmios Por Produtividade (funcionários)',
        'Rescisões',
        'Salários Dos Funcionários',
        'Uniformes',
        'Vale Transporte',
        'Ação Trabalhista',
        'Fgts',
      ].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.D,
          system_id: lift.id,
        }),
        ['description', 'system_id'],
      ),
    );
    await ff_third.related('children').fetchOrCreateMany(
      ['Água e Esgoto', 'Energia Elétrica', 'Manutenção De Equipamentos'].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.D,
          system_id: lift.id,
        }),
      ),
      'description',
    );
    await ff_fourth.related('children').fetchOrCreateMany(
      [
        'Contribuições Sindicais',
        'Darf Contribuição Social - Csll',
        'Darf Imposto De Renda - Irpj',
        'Darf Irrf Sobre Aluguel/salários/outros',
        'Impostos E Taxas',
        'Iof',
        'Iptu',
      ].map(elem => ({
        description: elem,
        code: '',
        type: AccountPlanType.D,
        system_id: lift.id,
      })),
      'description',
    );

    // ----------------------------------------
    const financialCostsPlanGroup = accountPlanGroups.find(
      accountPlanGroup =>
        accountPlanGroup.description === 'RESULTADO FINANCEIRO',
    );
    if (!financialCostsPlanGroup) {
      throw new Error('RESULTADO FINANCEIRO not found');
    }

    const [ffin_first, ffin_second] = await financialCostsPlanGroup
      .related('accountPlans')
      .fetchOrCreateMany(
        [
          {
            description: 'Despesas Financeiras',
            code: '',
            type: AccountPlanType.D,
            system_id: lift.id,
          },
          {
            description: 'Receitas Financeiras',
            code: '',
            type: AccountPlanType.C,
            system_id: lift.id,
          },
        ],
        ['description', 'system_id'],
      );
    await ffin_first.related('children').fetchOrCreateMany(
      [
        'Despesas Bancárias',
        'Juros De Financiamentos',
        'Juros Pagos A Fornecedores',
        'Taxas De Boletos Bancários',
        'Taxa Administração Cartão Débito Ou Crédito',
      ].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.D,
          system_id: lift.id,
        }),
        ['description', 'system_id'],
      ),
    );
    await ffin_second.related('children').fetchOrCreateMany(
      [
        'Descontos Obtidos',
        'Juros De Aplicações Financeiras',
        'Juros/multas Recebidos',
      ].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.C,
          system_id: lift.id,
        }),
        ['description', 'system_id'],
      ),
    );

    // ----------------------------------------
    const extraCostsPlanGroup = accountPlanGroups.find(
      accountPlanGroup => accountPlanGroup.description === 'EXTRA OPERACIONAL',
    );
    if (!extraCostsPlanGroup) {
      throw new Error('EXTRA OPERACIONAL not found');
    }

    await extraCostsPlanGroup.related('accountPlans').fetchOrCreateMany(
      [
        'Benfeitoria Em Imóveis De Terceiros',
        'Imóveis',
        'Equipamentos De Informática',
        'Maquinas E Equipamentos',
        'Móveis E Utensílios',
        'Empréstimos De Capital De Giro',
        'Financiamentos',
        'Distribuição De Lucro',
      ].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.D,
          system_id: lift.id,
        }),
        ['description', 'system_id'],
      ),
    );

    await extraCostsPlanGroup.related('accountPlans').fetchOrCreateMany(
      ['Aporte de capital', 'Outras receitas da empresa'].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.C,
          system_id: lift.id,
        }),
        ['description', 'system_id'],
      ),
    );

    // ----------------------------------------
    await TemplateReplacement.fetchOrCreateMany(
      ['replacer', 'system_id'],
      [
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'name',
          replacer: '[TUTOR_NOME]',
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'firstName',
          replacer: '[TUTOR_PRIMEIRONOME]',
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'address',
          replacer: '[TUTOR_ENDERECO]',
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'district',
          replacer: '[TUTOR_BAIRRO]',
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'city',
          replacer: '[TUTOR_CIDADE]',
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'state',
          replacer: '[TUTOR_UF]',
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'postalCode',
          replacer: '[TUTOR_CEP]',
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'document',
          replacer: '[TUTOR_CPF]',
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'inscription',
          replacer: '[TUTOR_RG]',
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'cellphone',
          replacer: '[TUTOR_TELEFONE]',
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'email',
          replacer: '[TUTOR_EMAIL]',
        },

        {
          origin: TemplateReplacementOrigin.BUSINESS,
          attribute: 'fantasyName',
          replacer: '[CLINICA_FANTASIA]',
        },
        {
          origin: TemplateReplacementOrigin.BUSINESS,
          attribute: 'companyName',
          replacer: '[CLINICA_RAZAOSOCIAL]',
        },
        {
          origin: TemplateReplacementOrigin.BUSINESS,
          attribute: 'document',
          replacer: '[CLINICA_CNPJ]',
        },
        {
          origin: TemplateReplacementOrigin.BUSINESS,
          attribute: 'address',
          replacer: '[CLINICA_ENDERECO]',
        },
        {
          origin: TemplateReplacementOrigin.BUSINESS,
          attribute: 'district',
          replacer: '[CLINICA_BAIRRO]',
        },
        {
          origin: TemplateReplacementOrigin.BUSINESS,
          attribute: 'city',
          replacer: '[CLINICA_CIDADE]',
        },
        {
          origin: TemplateReplacementOrigin.BUSINESS,
          attribute: 'state',
          replacer: '[CLINICA_UF]',
        },
        {
          origin: TemplateReplacementOrigin.BUSINESS,
          attribute: 'postalCode',
          replacer: '[CLINICA_CEP]',
        },
        {
          origin: TemplateReplacementOrigin.BUSINESS,
          attribute: 'phone',
          replacer: '[CLINICA_TELEFONE]',
        },
        {
          origin: TemplateReplacementOrigin.BUSINESS,
          attribute: 'email',
          replacer: '[CLINICA_EMAIL]',
        },

        {
          origin: TemplateReplacementOrigin.USER,
          attribute: 'name',
          replacer: '[USUARIO_NOME]',
        },
        {
          origin: TemplateReplacementOrigin.USER,
          attribute: 'treatment',
          replacer: '[USUARIO_TRATAMENTO]',
        },
        {
          origin: TemplateReplacementOrigin.USER,
          attribute: 'phone',
          replacer: '[USUARIO_CELULAR]',
        },
        {
          origin: TemplateReplacementOrigin.USER,
          attribute: 'role',
          replacer: '[USUARIO_CARGO]',
        },
        {
          origin: TemplateReplacementOrigin.USER,
          attribute: 'licensingJob',
          replacer: '[USUARIO_TRABALHO]',
        },

        {
          origin: TemplateReplacementOrigin.SYSTEM,
          attribute: 'date',
          replacer: '[SISTEMA_DATA]',
        },
        {
          origin: TemplateReplacementOrigin.SYSTEM,
          attribute: 'dateextension',
          replacer: '[SISTEMA_DATAEXTENSO]',
        },
        {
          origin: TemplateReplacementOrigin.SYSTEM,
          attribute: 'time',
          replacer: '[SISTEMA_HORA]',
        },
      ].map(item => ({
        system_id: lift.id,
        ...item,
      })),
    );
  }
}
