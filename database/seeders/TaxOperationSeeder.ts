import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import { MovementCategory, MovementType } from 'App/Models/TaxationGroupRule';
import TaxOperation from 'App/Models/TaxOperation';

export default class extends BaseSeeder {
  private BASE: Array<Partial<TaxOperation>> = [
    {
      code: '1.102',
      description: 'Compra para comercialização',
      movementType: MovementType.E,
      movementCategory: MovementCategory.NE,
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '1.152',
      description: 'Transferência para comercialização',
      movementType: MovementType.S,
      movementCategory: MovementCategory.TS,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '1.202',
      description:
        'Devolução de venda de mercadoria adquirida ou recebida de terceiros',
      movementCategory: MovementCategory.DS,
      movementType: MovementType.S,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '1.403',
      description:
        'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
      movementCategory: MovementCategory.NE,
      movementType: MovementType.E,
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '1.411',
      description:
        'Devolução de venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária',
      movementCategory: MovementCategory.DE,
      movementType: MovementType.E,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '1.949',
      description:
        'Outra entrada de mercadoria ou prestação de serviço não especificada',
      movementCategory: MovementCategory.OE,
      movementType: MovementType.E,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '2.102',
      description: 'Compra para comercialização',
      movementType: MovementType.E,
      movementCategory: MovementCategory.NE,
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '2.152',
      description: 'Transferência para comercialização',
      movementCategory: MovementCategory.TS,
      movementType: MovementType.S,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '2.202',
      description:
        'Devolução de venda de mercadoria adquirida ou recebida de terceiros',
      movementCategory: MovementCategory.DS,
      movementType: MovementType.S,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '2.403',
      description:
        'Compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
      movementCategory: MovementCategory.NE,
      movementType: MovementType.E,
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '2.411',
      description:
        'Devolução de venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária',
      movementCategory: MovementCategory.DE,
      movementType: MovementType.E,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '2.949',
      description:
        'Outra entrada de mercadoria ou prestação de serviço não especificada',
      movementCategory: MovementCategory.OE,
      movementType: MovementType.E,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '5.102',
      description:
        'Venda de Mercadoria Adquirida ou Recebida de Terceiros Dentro do Estado',
      movementCategory: MovementCategory.NS,
      movementType: MovementType.S,
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '5.152',
      description:
        'Transferencia de Mercadoria Adquirida ou Recebida de Terceiros Dentro do Estado',
      movementCategory: MovementCategory.TS,
      movementType: MovementType.S,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '5.202',
      description: 'Devolução de Compra para Comercialização',
      movementCategory: MovementCategory.DS,
      movementType: MovementType.S,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '5.405',
      description:
        'Venda de mercadoria, adquirida ou recebida de terceiros, sujeita ao regime de substituição tributária, na condição de contribuinte-substituído',
      movementCategory: MovementCategory.NS,
      movementType: MovementType.S,
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '5.411',
      description:
        'Devolução de compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
      movementCategory: MovementCategory.DS,
      movementType: MovementType.S,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '5.927',
      description:
        'Lançamento efetuado a título de baixa de estoque decorrente de perda, roubo ou deterioração',
      movementCategory: MovementCategory.OS,
      movementType: MovementType.S,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '5.949',
      description:
        'Outra saída de mercadoria ou prestação de serviço não especificado',
      movementCategory: MovementCategory.OS,
      movementType: MovementType.S,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '6.102',
      description:
        'Venda de Mercadoria Adquirida ou Recebida de Terceiros Fora do Estado',
      movementCategory: MovementCategory.NS,
      movementType: MovementType.S,
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '6.152',
      description:
        'Transferencia de Mercadoria Adquirida ou Recebida de Terceiros Fora do Estado',
      movementCategory: MovementCategory.TS,
      movementType: MovementType.S,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '6.202',
      description: 'Devolução de Compra para Comercialização',
      movementCategory: MovementCategory.DS,
      movementType: MovementType.S,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '6.404',
      description:
        'Venda de mercadoria sujeita ao regime de substituição tributária, cujo imposto já tenha sido retido anteriormente',
      movementCategory: MovementCategory.NS,
      movementType: MovementType.S,
      generatesFinancial: true,
      accountingResult: true,
    },
    {
      code: '6.411',
      description:
        'Devolução de compra para comercialização em operação com mercadoria sujeita ao regime de substituição tributária',
      movementCategory: MovementCategory.DS,
      movementType: MovementType.S,
      generatesFinancial: false,
      accountingResult: false,
    },
    {
      code: '6.949',
      description:
        'Outra saída de mercadoria ou prestação de serviço não especificado',
      movementCategory: MovementCategory.OS,
      movementType: MovementType.S,
      generatesFinancial: false,
      accountingResult: false,
    },
  ];

  public async run() {
    await TaxOperation.fetchOrCreateMany('code', this.BASE);
  }
}
