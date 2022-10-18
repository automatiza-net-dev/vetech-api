import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import TaxOperation from 'App/Models/TaxOperation';

export default class extends BaseSeeder {
  private BASE: Array<Partial<TaxOperation>> = [
    {
      code: '1.102',
      description: 'Compra para comercialização',
      movementCategory: 'NE',
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '1.152',
      description: 'Transferência para comercialização',
      movementCategory: 'TS',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '1.202',
      description:
        'Devolução de venda de mercadoria adquirida ou recebida de terceiros',
      movementCategory: 'DS',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '1.403',
      description:
        'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
      movementCategory: 'NE',
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '1.411',
      description:
        'Devolução de venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária',
      movementCategory: 'DE',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '1.949',
      description:
        'Outra entrada de mercadoria ou prestação de serviço não especificada',
      movementCategory: 'OE',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '2.102',
      description: 'Compra para comercialização',
      movementCategory: 'NE',
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '2.152',
      description: 'Transferência para comercialização',
      movementCategory: 'TS',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '2.202',
      description:
        'Devolução de venda de mercadoria adquirida ou recebida de terceiros',
      movementCategory: 'DS',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '2.403',
      description:
        'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
      movementCategory: 'NE',
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '2.411',
      description:
        'Devolução de venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária',
      movementCategory: 'DE',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '2.949',
      description:
        'Outra entrada de mercadoria ou prestação de serviço não especificada',
      movementCategory: 'OE',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '5.102',
      description:
        'Venda de Mercadoria Adquirida ou Recebida de Terceiros Dentro do Estado',
      movementCategory: 'NS',
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '5.152',
      description:
        'Transferencia de Mercadoria Adquirida ou Recebida de Terceiros Dentro do Estado',
      movementCategory: 'TS',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '5.202',
      description: 'Devolução de Compra para Comercialização',
      movementCategory: 'DS',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '5.405',
      description:
        'Venda de mercadoria, adquirida ou recebida de terceiros, sujeita ao regime de substituição tributária, na condição de contribuinte-substituído',
      movementCategory: 'NS',
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '5.411',
      description:
        'Devolução de compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
      movementCategory: 'DS',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '5.927',
      description:
        'Lançamento efetuado a título de baixa de estoque decorrente de perda, roubo ou deterioração',
      movementCategory: 'OS',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '5.949',
      description:
        'Outra saída de mercadoria ou prestação de serviço não especificado',
      movementCategory: 'OS',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '6.102',
      description:
        'Venda de Mercadoria Adquirida ou Recebida de Terceiros Fora do Estado',
      movementCategory: 'NS',
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '6.152',
      description:
        'Transferencia de Mercadoria Adquirida ou Recebida de Terceiros Fora do Estado',
      movementCategory: 'TS',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '6.202',
      description: 'Devolução de Compra para Comercialização',
      movementCategory: 'DS',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '6.404',
      description:
        'Venda de mercadoria sujeita ao regime de substituição tributária, cujo imposto já tenha sido retido anteriormente',
      movementCategory: 'NS',
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '6.411',
      description:
        'Devolução de compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
      movementCategory: 'DS',
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '6.949',
      description:
        'Outra saída de mercadoria ou prestação de serviço não especificado',
      movementCategory: 'OS',
      generatesFinancial: false,
      accountingResult: false,
    },
  ];

  public async run() {
    await TaxOperation.fetchOrCreateMany('code', this.BASE);
  }
}
