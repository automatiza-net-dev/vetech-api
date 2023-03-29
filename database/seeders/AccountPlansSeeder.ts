import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import { AccountPlanType } from 'App/Models/AccountPlan';
import AccountPlanGroup from 'App/Models/AccountPlanGroup';

export default class extends BaseSeeder {
  public async run() {
    const accountPlanGroups = await AccountPlanGroup.all();

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
        },
        {
          description: 'Receita de serviços',
          code: '',
          type: AccountPlanType.C,
        },
      ],
      'description',
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
          },
        ],
        'description',
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
        }),
        'description',
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
        }),
        'description',
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
          }),
          'description',
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
        }),
        'description',
      ),
    );
    await fc_second.related('children').fetchOrCreateMany(
      ['Salários Dos Veterinários'].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.D,
        }),
        'description',
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
        }),
        'description',
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
          }),
          'description',
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
        }),
        'description',
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
        }),
        'description',
      ),
    );
    await ff_third.related('children').fetchOrCreateMany(
      ['Água e Esgoto', 'Energia Elétrica', 'Manutenção De Equipamentos'].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.D,
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
          },
          {
            description: 'Receitas Financeiras',
            code: '',
            type: AccountPlanType.C,
          },
        ],
        'description',
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
        }),
        'description',
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
        }),
        'description',
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
        }),
        'description',
      ),
    );

    await extraCostsPlanGroup.related('accountPlans').fetchOrCreateMany(
      ['Aporte de capital', 'Outras receitas da empresa'].map(
        elem => ({
          description: elem,
          code: '',
          type: AccountPlanType.C,
        }),
        'description',
      ),
    );
  }
}
