import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Bank from 'App/Models/Bank';

export default class extends BaseSeeder {
  private BASE: Array<Partial<Bank>> = [
    {
      code: '001',
      name: 'Banco do Brasil S.A.',
    },
    {
      code: '003',
      name: 'Banco da Amazônia S.A.',
    },
    {
      code: '004',
      name: 'Banco do Nordeste do Brasil S.A.',
    },
    {
      code: '007',
      name: 'Banco Nacional de Desenvolvimento Econômico e Social BNDES',
    },
    {
      code: '010',
      name: 'Credicoamo Crédito Rural Cooperativa',
    },
    {
      code: '011',
      name: 'Credit Suisse Hedging-Griffo Corretora de Valores S.A.',
    },
    {
      code: '012',
      name: 'Banco Inbursa S.A.',
    },
    {
      code: '014',
      name: 'Natixis Brasil S.A. Banco Múltiplo',
    },
    {
      code: '015',
      name: 'UBS Brasil Corretora de Câmbio, Títulos e Valores Mobiliários S.A.',
    },
    {
      code: '016',
      name: 'Coop de Créd. Mútuo dos Despachantes de Trânsito de SC e Rio Grande do Sul',
    },
    {
      code: '017',
      name: 'BNY Mellon Banco S.A.',
    },
    {
      code: '018',
      name: 'Banco Tricury S.A.',
    },
    {
      code: '021',
      name: 'Banestes S.A. Banco do Estado do Espírito Santo',
    },
    {
      code: '024',
      name: 'Banco Bandepe S.A.',
    },
    {
      code: '025',
      name: 'Banco Alfa S.A.',
    },
    {
      code: '029',
      name: 'Banco Itaú Consignado S.A.',
    },
    {
      code: '033',
      name: 'Banco Santander (Brasil) S. A.',
    },
    {
      code: '036',
      name: 'Banco Bradesco BBI S.A.',
    },
    {
      code: '037',
      name: 'Banco do Estado do Pará S.A.',
    },
    {
      code: '040',
      name: 'Banco Cargill S.A.',
    },
    {
      code: '041',
      name: 'Banco do Estado do Rio Grande do Sul S.A.',
    },
    {
      code: '047',
      name: 'Banco do Estado de Sergipe S.A.',
    },
    {
      code: '060',
      name: 'Confidence Corretora de Câmbio S.A.',
    },
    {
      code: '062',
      name: 'Hipercard Banco Múltiplo S.A.',
    },
    {
      code: '063',
      name: 'Banco Bradescard S.A.',
    },
    {
      code: '064',
      name: 'Goldman Sachs do Brasil Banco Múltiplo S. A.',
    },
    {
      code: '065',
      name: 'Banco AndBank (Brasil) S.A.',
    },
    {
      code: '066',
      name: 'Banco Morgan Stanley S. A.',
    },
    {
      code: '069',
      name: 'Banco Crefisa S.A.',
    },
    {
      code: '070',
      name: 'Banco de Brasília S.A.',
    },
    {
      code: '074',
      name: 'Banco J. Safra S.A.',
    },
    {
      code: '075',
      name: 'Banco ABN Amro S.A.',
    },
    {
      code: '076',
      name: 'Banco KDB do Brasil S.A.',
    },
    {
      code: '077',
      name: 'Banco Inter S.A.',
    },
    {
      code: '078',
      name: 'Haitong Banco de Investimento do Brasil S.A.',
    },
    {
      code: '079',
      name: 'Banco Original do Agronegócio S.A.',
    },
    {
      code: '080',
      name: 'BT Corretora de Câmbio Ltda.',
    },
    {
      code: '081',
      name: 'BBN Banco Brasileiro de Negocios S.A.',
    },
    {
      code: '082',
      name: 'Banco Topazio S.A.',
    },
    {
      code: '083',
      name: 'Banco da China Brasil S.A.',
    },
    {
      code: '084',
      name: 'Uniprime Norte do Paraná - Cooperativa de Crédito Ltda.',
    },
    {
      code: '085',
      name: 'Cooperativa Central de Crédito - Ailos',
    },
    {
      code: '089',
      name: 'Cooperativa de Crédito Rural da Região da Mogiana',
    },
    {
      code: '091',
      name: 'Central de Cooperativas de Economia e Crédito Mútuo do Est RS - Unicred',
    },
    {
      code: '092',
      name: 'BRK S.A. Crédito, Financiamento e Investimento',
    },
    {
      code: '093',
      name: 'Pólocred Sociedade de Crédito ao Microempreendedor e à Empresa de Pequeno Porte',
    },
    {
      code: '094',
      name: 'Banco Finaxis S.A.',
    },
    {
      code: '095',
      name: 'Banco Confidence de Câmbio S.A.',
    },
    {
      code: '096',
      name: 'Banco B3 S.A.',
    },
    {
      code: '097',
      name: 'Cooperativa Central de Crédito Noroeste Brasileiro Ltda - CentralCredi',
    },
    {
      code: '098',
      name: 'Credialiança Cooperativa de Crédito Rural',
    },
    {
      code: '099',
      name: 'Uniprime Central – Central Interestadual de Cooperativas de Crédito Ltda.',
    },
    {
      code: '100',
      name: 'Planner Corretora de Valores S.A.',
    },
    {
      code: '101',
      name: 'Renascença Distribuidora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: '102',
      name: 'XP Investimentos Corretora de Câmbio Títulos e Valores Mobiliários S.A.',
    },
    {
      code: '104',
      name: 'Caixa Econômica Federal',
    },
    {
      code: '105',
      name: 'Lecca Crédito, Financiamento e Investimento S/A',
    },
    {
      code: '107',
      name: 'Banco Bocom BBM S.A.',
    },
    {
      code: '108',
      name: 'PortoCred S.A. Crédito, Financiamento e Investimento',
    },
    {
      code: '111',
      name: 'Oliveira Trust Distribuidora de Títulos e Valores Mobiliários S.A.',
    },
    {
      code: '113',
      name: 'Magliano S.A. Corretora de Cambio e Valores Mobiliarios',
    },
    {
      code: '114',
      name: 'Central Cooperativa de Crédito no Estado do Espírito Santo - CECOOP',
    },
    {
      code: '117',
      name: 'Advanced Corretora de Câmbio Ltda.',
    },
    {
      code: '118',
      name: 'Standard Chartered Bank (Brasil) S.A. Banco de Investimento',
    },
    {
      code: '119',
      name: 'Banco Western Union do Brasil S.A.',
    },
    {
      code: '120',
      name: 'Banco Rodobens SA',
    },
    {
      code: '121',
      name: 'Banco Agibank S.A.',
    },
    {
      code: '122',
      name: 'Banco Bradesco BERJ S.A.',
    },
    {
      code: '124',
      name: 'Banco Woori Bank do Brasil S.A.',
    },
    {
      code: '125',
      name: 'Brasil Plural S.A. Banco Múltiplo',
    },
    {
      code: '126',
      name: 'BR Partners Banco de Investimento S.A.',
    },
    {
      code: '127',
      name: 'codepe Corretora de Valores e Câmbio S.A.',
    },
    {
      code: '128',
      name: 'MS Bank S.A. Banco de Câmbio',
    },
    {
      code: '129',
      name: 'UBS Brasil Banco de Investimento S.A.',
    },
    {
      code: '130',
      name: 'Caruana S.A. Sociedade de Crédito, Financiamento e Investimento',
    },
    {
      code: '131',
      name: 'Tullett Prebon Brasil Corretora de Valores e Câmbio Ltda.',
    },
    {
      code: '132',
      name: 'ICBC do Brasil Banco Múltiplo S.A.',
    },
    {
      code: '133',
      name: 'Confederação Nacional das Cooperativas Centrais de Crédito e Economia Familiar e',
    },
    {
      code: '134',
      name: 'BGC Liquidez Distribuidora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: '136',
      name: 'Confederação Nacional das Cooperativas Centrais Unicred Ltda – Unicred do Brasil',
    },
    {
      code: '137',
      name: 'Multimoney Corretora de Câmbio Ltda',
    },
    {
      code: '138',
      name: 'Get Money Corretora de Câmbio S.A.',
    },
    {
      code: '139',
      name: 'Intesa Sanpaolo Brasil S.A. - Banco Múltiplo',
    },
    {
      code: '140',
      name: 'Easynvest - Título Corretora de Valores SA',
    },
    {
      code: '142',
      name: 'Broker Brasil Corretora de Câmbio Ltda.',
    },
    {
      code: '143',
      name: 'Treviso Corretora de Câmbio S.A.',
    },
    {
      code: '144',
      name: 'Bexs Banco de Câmbio S.A.',
    },
    {
      code: '145',
      name: 'Levycam - Corretora de Câmbio e Valores Ltda.',
    },
    {
      code: '146',
      name: 'Guitta Corretora de Câmbio Ltda.',
    },
    {
      code: '149',
      name: 'Facta Financeira S.A. - Crédito Financiamento e Investimento',
    },
    {
      code: '157',
      name: 'ICAP do Brasil Corretora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: '159',
      name: 'Casa do Crédito S.A. Sociedade de Crédito ao Microempreendedor',
    },
    {
      code: '163',
      name: 'Commerzbank Brasil S.A. - Banco Múltiplo',
    },
    {
      code: '169',
      name: 'Banco Olé Bonsucesso Consignado S.A.',
    },
    {
      code: '172',
      name: 'Albatross Corretora de Câmbio e Valores S.A',
    },
    {
      code: '173',
      name: 'BRL Trust Distribuidora de Títulos e Valores Mobiliários S.A.',
    },
    {
      code: '174',
      name: 'Pernambucanas Financiadora S.A. Crédito, Financiamento e Investimento',
    },
    {
      code: '177',
      name: 'Guide Investimentos S.A. Corretora de Valores',
    },
    {
      code: '180',
      name: 'CM Capital Markets Corretora de Câmbio, Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: '182',
      name: 'Dacasa Financeira S/A - Sociedade de Crédito, Financiamento e Investimento',
    },
    {
      code: '183',
      name: 'Socred S.A. - Sociedade de Crédito ao Microempreendedor',
    },
    {
      code: '184',
      name: 'Banco Itaú BBA S.A.',
    },
    {
      code: '188',
      name: 'Ativa Investimentos S.A. Corretora de Títulos Câmbio e Valores',
    },
    {
      code: '189',
      name: 'HS Financeira S/A Crédito, Financiamento e Investimentos',
    },
    {
      code: '190',
      name: 'Cooperativa de Economia e Crédito Mútuo dos Servidores Públicos Estaduais do Rio',
    },
    {
      code: '191',
      name: 'Nova Futura Corretora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: '194',
      name: 'Parmetal Distribuidora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: '196',
      name: 'Fair Corretora de Câmbio S.A.',
    },
    {
      code: '197',
      name: 'Stone Pagamentos S.A.',
    },
    {
      code: '204',
      name: 'Banco Bradesco Cartões S.A.',
    },
    {
      code: '208',
      name: 'Banco BTG Pactual S.A.',
    },
    {
      code: '212',
      name: 'Banco Original S.A.',
    },
    {
      code: '213',
      name: 'Banco Arbi S.A.',
    },
    {
      code: '217',
      name: 'Banco John Deere S.A.',
    },
    {
      code: '218',
      name: 'Banco BS2 S.A.',
    },
    {
      code: '222',
      name: 'Banco Credit Agrícole Brasil S.A.',
    },
    {
      code: '224',
      name: 'Banco Fibra S.A.',
    },
    {
      code: '233',
      name: 'Banco Cifra S.A.',
    },
    {
      code: '237',
      name: 'Banco Bradesco S.A.',
    },
    {
      code: '241',
      name: 'Banco Clássico S.A.',
    },
    {
      code: '243',
      name: 'Banco Máxima S.A.',
    },
    {
      code: '246',
      name: 'Banco ABC Brasil S.A.',
    },
    {
      code: '249',
      name: 'Banco Investcred Unibanco S.A.',
    },
    {
      code: '250',
      name: 'BCV - Banco de Crédito e Varejo S/A',
    },
    {
      code: '253',
      name: 'Bexs Corretora de Câmbio S/A',
    },
    {
      code: '254',
      name: 'Parana Banco S. A.',
    },
    {
      code: '260',
      name: 'Nu Pagamentos S.A.',
    },
    {
      code: '265',
      name: 'Banco Fator S.A.',
    },
    {
      code: '266',
      name: 'Banco Cédula S.A.',
    },
    {
      code: '268',
      name: 'Barigui Companhia Hipotecária',
    },
    {
      code: '269',
      name: 'HSBC Brasil S.A. Banco de Investimento',
    },
    {
      code: '270',
      name: 'Sagitur Corretora de Câmbio Ltda.',
    },
    {
      code: '271',
      name: 'IB Corretora de Câmbio, Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: '273',
      name: 'Cooperativa de Crédito Rural de São Miguel do Oeste - Sulcredi/São Miguel',
    },
    {
      code: '276',
      name: 'Senff S.A. - Crédito, Financiamento e Investimento',
    },
    {
      code: '278',
      name: 'Genial Investimentos Corretora de Valores Mobiliários S.A.',
    },
    {
      code: '279',
      name: 'Cooperativa de Crédito Rural de Primavera do Leste',
    },
    {
      code: '280',
      name: 'Avista S.A. Crédito, Financiamento e Investimento',
    },
    {
      code: '281',
      name: 'Cooperativa de Crédito Rural Coopavel',
    },
    {
      code: '283',
      name: 'RB Capital Investimentos Distribuidora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: '285',
      name: 'Frente Corretora de Câmbio Ltda.',
    },
    {
      code: '286',
      name: 'Cooperativa de Crédito Rural de Ouro Sulcredi/Ouro',
    },
    {
      code: '288',
      name: 'Carol Distribuidora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: '292',
      name: 'BS2 Distribuidora de Títulos e Valores Mobiliários S.A.',
    },
    {
      code: '293',
      name: 'Lastro RDV Distribuidora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: '298',
      name: "Vip's Corretora de Câmbio Ltda.",
    },
    {
      code: '300',
      name: 'Banco de la Nacion Argentina',
    },
    {
      code: '301',
      name: 'BPP Instituição de Pagamento S.A.',
    },
    {
      code: '307',
      name: 'Terra Investimentos Distribuidora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: '310',
      name: 'Vortx Distribuidora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: '318',
      name: 'Banco BMG S.A.',
    },
    {
      code: '320',
      name: 'China Construction Bank (Brasil) Banco Múltiplo S/A',
    },
    {
      code: '341',
      name: 'Itaú Unibanco S.A.',
    },
    {
      code: '366',
      name: 'Banco Société Générale Brasil S.A.',
    },
    {
      code: '370',
      name: 'Banco Mizuho do Brasil S.A.',
    },
    {
      code: '376',
      name: 'Banco J. P. Morgan S. A.',
    },
    {
      code: '389',
      name: 'Banco Mercantil do Brasil S.A.',
    },
    {
      code: '394',
      name: 'Banco Bradesco Financiamentos S.A.',
    },
    {
      code: '399',
      name: 'Kirton Bank S.A. - Banco Múltiplo',
    },
    {
      code: '412',
      name: 'Banco Capital S. A.',
    },
    {
      code: '422',
      name: 'Banco Safra S.A.',
    },
    {
      code: '456',
      name: 'Banco MUFG Brasil S.A.',
    },
    {
      code: '464',
      name: 'Banco Sumitomo Mitsui Brasileiro S.A.',
    },
    {
      code: '473',
      name: 'Banco Caixa Geral - Brasil S.A.',
    },
    {
      code: '477',
      name: 'Citibank N.A.',
    },
    {
      code: '479',
      name: 'Banco ItauBank S.A.',
    },
    {
      code: '487',
      name: 'Deutsche Bank S.A. - Banco Alemão',
    },
    {
      code: '488',
      name: 'JPMorgan Chase Bank, National Association',
    },
    {
      code: '492',
      name: 'ING Bank N.V.',
    },
    {
      code: '494',
      name: 'Banco de La Republica Oriental del Uruguay',
    },
    {
      code: '495',
      name: 'Banco de La Provincia de Buenos Aires',
    },
    {
      code: '505',
      name: 'Banco Credit Suisse (Brasil) S.A.',
    },
    {
      code: '545',
      name: 'Senso Corretora de Câmbio e Valores Mobiliários S.A.',
    },
    {
      code: '600',
      name: 'Banco Luso Brasileiro S.A.',
    },
    {
      code: '604',
      name: 'Banco Industrial do Brasil S.A.',
    },
    {
      code: '610',
      name: 'Banco VR S.A.',
    },
    {
      code: '611',
      name: 'Banco Paulista S.A.',
    },
    {
      code: '612',
      name: 'Banco Guanabara S.A.',
    },
    {
      code: '613',
      name: 'Omni Banco S.A.',
    },
    {
      code: '623',
      name: 'Banco Pan S.A.',
    },
    {
      code: '626',
      name: 'Banco Ficsa S. A.',
    },
    {
      code: '630',
      name: 'Banco Intercap S.A.',
    },
    {
      code: '633',
      name: 'Banco Rendimento S.A.',
    },
    {
      code: '634',
      name: 'Banco Triângulo S.A.',
    },
    {
      code: '637',
      name: 'Banco Sofisa S. A.',
    },
    {
      code: '641',
      name: 'Banco Alvorada S.A.',
    },
    {
      code: '643',
      name: 'Banco Pine S.A.',
    },
    {
      code: '652',
      name: 'Itaú Unibanco Holding S.A.',
    },
    {
      code: '653',
      name: 'Banco Indusval S. A.',
    },
    {
      code: '654',
      name: 'Banco A. J. Renner S.A.',
    },
    {
      code: '655',
      name: 'Banco Votorantim S.A.',
    },
    {
      code: '707',
      name: 'Banco Daycoval S.A.',
    },
    {
      code: '712',
      name: 'Banco Ourinvest S.A.',
    },
    {
      code: '739',
      name: 'Banco Cetelem S.A.',
    },
    {
      code: '741',
      name: 'Banco Ribeirão Preto S.A.',
    },
    {
      code: '743',
      name: 'Banco Semear S.A.',
    },
    {
      code: '745',
      name: 'Banco Citibank S.A.',
    },
    {
      code: '746',
      name: 'Banco Modal S.A.',
    },
    {
      code: '747',
      name: 'Banco Rabobank International Brasil S.A.',
    },
    {
      code: '748',
      name: 'Banco Cooperativo Sicredi S. A.',
    },
    {
      code: '751',
      name: 'Scotiabank Brasil S.A. Banco Múltiplo',
    },
    {
      code: '752',
      name: 'Banco BNP Paribas Brasil S.A.',
    },
    {
      code: '753',
      name: 'Novo Banco Continental S.A. - Banco Múltiplo',
    },
    {
      code: '754',
      name: 'Banco Sistema S.A.',
    },
    {
      code: '755',
      name: 'Bank of America Merrill Lynch Banco Múltiplo S.A.',
    },
    {
      code: '756',
      name: 'Banco Cooperativo do Brasil S/A - Bancoob',
    },
    {
      code: '757',
      name: 'Banco Keb Hana do Brasil S. A.',
    },
  ];

  public async run() {
    await Bank.fetchOrCreateMany('code', this.BASE);
  }
}
