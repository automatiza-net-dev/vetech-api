import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Bank from 'App/Models/Bank';

export default class extends BaseSeeder {
  private BASE = [
    {
      code: 1,
      nomeBanco: 'Banco do Brasil S.A.',
    },
    {
      code: 3,
      nomeBanco: 'Banco da Amazônia S.A.',
    },
    {
      code: 4,
      nomeBanco: 'Banco do Nordeste do Brasil S.A.',
    },
    {
      code: 7,
      nomeBanco: 'Banco Nacional de Desenvolvimento Econômico e Social – BNDES',
    },
    {
      code: 10,
      nomeBanco: 'CREDICOAMO CREDITO RURAL COOPERATIVA',
    },
    {
      code: 11,
      nomeBanco: 'CREDIT SUISSE HEDGING-GRIFFO CORRETORA DE VALORES S.A',
    },
    {
      code: 12,
      nomeBanco: 'Banco Inbursa S.A.',
    },
    {
      code: 14,
      nomeBanco: 'State Street Brasil S.A. – Banco Comercial',
    },
    {
      code: 15,
      nomeBanco:
        'UBS Brasil Corretora de Câmbio, Títulos e Valores Mobiliários S.A.',
    },
    {
      code: 16,
      nomeBanco:
        'COOPERATIVA DE CRÉDITO MÚTUO DOS DESPACHANTES DE TRÂNSITO DE SANTA CATARINA E RI',
    },
    {
      code: 17,
      nomeBanco: 'BNY Mellon Banco S.A.',
    },
    {
      code: 18,
      nomeBanco: 'Banco Tricury S.A.',
    },
    {
      code: 21,
      nomeBanco: 'BANESTES S.A. Banco do Estado do Espírito Santo',
    },
    {
      code: 24,
      nomeBanco: 'Banco BANDEPE S.A.',
    },
    {
      code: 25,
      nomeBanco: 'Banco Alfa S.A.',
    },
    {
      code: 29,
      nomeBanco: 'Banco Itaú Consignado S.A.',
    },
    {
      code: 33,
      nomeBanco: 'Banco Santander (Brasil) S.A.',
    },
    {
      code: 36,
      nomeBanco: 'Banco Bradesco BBI S.A.',
    },
    {
      code: 37,
      nomeBanco: 'Banco do Estado do Pará S.A.',
    },
    {
      code: 40,
      nomeBanco: 'Banco Cargill S.A.',
    },
    {
      code: 41,
      nomeBanco: 'Banco do Estado do Rio Grande do Sul S.A.',
    },
    {
      code: 47,
      nomeBanco: 'Banco do Estado de Sergipe S.A.',
    },
    {
      code: 60,
      nomeBanco: 'Confidence Corretora de Câmbio S.A.',
    },
    {
      code: 62,
      nomeBanco: 'Hipercard Banco Múltiplo S.A.',
    },
    {
      code: 63,
      nomeBanco: 'Banco Bradescard S.A.',
    },
    {
      code: 64,
      nomeBanco: 'Goldman Sachs do Brasil Banco Múltiplo S.A.',
    },
    {
      code: 65,
      nomeBanco: 'Banco Andbank (Brasil) S.A.',
    },
    {
      code: 66,
      nomeBanco: 'Banco Morgan Stanley S.A.',
    },
    {
      code: 69,
      nomeBanco: 'Banco Crefisa S.A.',
    },
    {
      code: 70,
      nomeBanco: 'BRB – Banco de Brasília S.A.',
    },
    {
      code: 74,
      nomeBanco: 'Banco J. Safra S.A.',
    },
    {
      code: 75,
      nomeBanco: 'Banco ABN AMRO S.A.',
    },
    {
      code: 76,
      nomeBanco: 'Banco KDB S.A.',
    },
    {
      code: 77,
      nomeBanco: 'Banco Inter S.A.',
    },
    {
      code: 78,
      nomeBanco: 'Haitong Banco de Investimento do Brasil S.A.',
    },
    {
      code: 79,
      nomeBanco: 'Banco Original do Agronegócio S.A.',
    },
    {
      code: 80,
      nomeBanco: 'B&T CORRETORA DE CAMBIO LTDA.',
    },
    {
      code: 81,
      nomeBanco: 'BancoSeguro S.A.',
    },
    {
      code: 82,
      nomeBanco: 'Banco Topázio S.A.',
    },
    {
      code: 83,
      nomeBanco: 'Banco da China Brasil S.A.',
    },
    {
      code: 84,
      nomeBanco:
        'Uniprime Norte do Paraná – Coop de Economia e Crédito Mútuo dos Médicos',
    },
    {
      code: 85,
      nomeBanco: 'Cooperativa Central de Crédito – AILOS',
    },
    {
      code: 89,
      nomeBanco: 'CREDISAN COOPERATIVA DE CRÉDITO',
    },
    {
      code: 91,
      nomeBanco:
        'CENTRAL DE COOPERATIVAS DE ECONOMIA E CRÉDITO MÚTUO DO ESTADO DO RIO GRANDE DO S',
    },
    {
      code: 92,
      nomeBanco: 'Brickell S.A. Crédito',
    },
    {
      code: 93,
      nomeBanco:
        'PÓLOCRED SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORT',
    },
    {
      code: 94,
      nomeBanco: 'Banco Finaxis S.A.',
    },
    {
      code: 95,
      nomeBanco: 'Travelex Banco de Câmbio S.A.',
    },
    {
      code: 96,
      nomeBanco: 'Banco B3 S.A.',
    },
    {
      code: 97,
      nomeBanco: 'Cooperativa Central de Crédito Noroeste Brasileiro Ltda.',
    },
    {
      code: 98,
      nomeBanco: 'Credialiança Cooperativa de Crédito Rural',
    },
    {
      code: 99,
      nomeBanco:
        'UNIPRIME CENTRAL – CENTRAL INTERESTADUAL DE COOPERATIVAS DE CREDITO LTDA.',
    },
    {
      code: 100,
      nomeBanco: 'Planner Corretora de Valores S.A.',
    },
    {
      code: 101,
      nomeBanco:
        'RENASCENCA DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA',
    },
    {
      code: 102,
      nomeBanco:
        'XP INVESTIMENTOS CORRETORA DE CÂMBIO,TÍTULOS E VALORES MOBILIÁRIOS S/A',
    },
    {
      code: 104,
      nomeBanco: 'Caixa Econômica Federal',
    },
    {
      code: 105,
      nomeBanco: 'Lecca Crédito, Financiamento e Investimento S/A',
    },
    {
      code: 107,
      nomeBanco: 'Banco BOCOM BBM S.A.',
    },
    {
      code: 108,
      nomeBanco: 'PORTOCRED S.A. – CREDITO, FINANCIAMENTO E INVESTIMENTO',
    },
    {
      code: 111,
      nomeBanco:
        'OLIVEIRA TRUST DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIARIOS S.A.',
    },
    {
      code: 113,
      nomeBanco: 'Magliano S.A. Corretora de Cambio e Valores Mobiliarios',
    },
    {
      code: 114,
      nomeBanco:
        'Central Cooperativa de Crédito no Estado do Espírito Santo – CECOOP',
    },
    {
      code: 117,
      nomeBanco: 'ADVANCED CORRETORA DE CÂMBIO LTDA',
    },
    {
      code: 119,
      nomeBanco: 'Banco Western Union do Brasil S.A.',
    },
    {
      code: 120,
      nomeBanco: 'Banco Rodobens S.A.',
    },
    {
      code: 121,
      nomeBanco: 'Banco Agibank S.A.',
    },
    {
      code: 122,
      nomeBanco: 'Banco Bradesco BERJ S.A.',
    },
    {
      code: 124,
      nomeBanco: 'Banco Woori Bank do Brasil S.A.',
    },
    {
      code: 125,
      nomeBanco: 'Plural S.A. – Banco Múltiplo',
    },
    {
      code: 126,
      nomeBanco: 'BR Partners Banco de Investimento S.A.',
    },
    {
      code: 127,
      nomeBanco: 'Codepe Corretora de Valores e Câmbio S.A.',
    },
    {
      code: 128,
      nomeBanco: 'MS Bank S.A. Banco de Câmbio',
    },
    {
      code: 129,
      nomeBanco: 'UBS Brasil Banco de Investimento S.A.',
    },
    {
      code: 130,
      nomeBanco:
        'CARUANA S.A. – SOCIEDADE DE CRÉDITO, FINANCIAMENTO E INVESTIMENTO',
    },
    {
      code: 131,
      nomeBanco: 'TULLETT PREBON BRASIL CORRETORA DE VALORES E CÂMBIO LTDA',
    },
    {
      code: 132,
      nomeBanco: 'ICBC do Brasil Banco Múltiplo S.A.',
    },
    {
      code: 133,
      nomeBanco:
        'CONFEDERAÇÃO NACIONAL DAS COOPERATIVAS CENTRAIS DE CRÉDITO E ECONOMIA FAMILIAR E',
    },
    {
      code: 134,
      nomeBanco:
        'BGC LIQUIDEZ DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA',
    },
    {
      code: 136,
      nomeBanco:
        'CONFEDERAÇÃO NACIONAL DAS COOPERATIVAS CENTRAIS UNICRED LTDA. – UNICRED DO BRASI',
    },
    {
      code: 138,
      nomeBanco: 'Get Money Corretora de Câmbio S.A.',
    },
    {
      code: 139,
      nomeBanco: 'Intesa Sanpaolo Brasil S.A. – Banco Múltiplo',
    },
    {
      code: 140,
      nomeBanco: 'Easynvest – Título Corretora de Valores SA',
    },
    {
      code: 142,
      nomeBanco: 'Broker Brasil Corretora de Câmbio Ltda.',
    },
    {
      code: 143,
      nomeBanco: 'Treviso Corretora de Câmbio S.A.',
    },
    {
      code: 144,
      nomeBanco: 'BEXS Banco de Câmbio S.A.',
    },
    {
      code: 145,
      nomeBanco: 'LEVYCAM – CORRETORA DE CAMBIO E VALORES LTDA.',
    },
    {
      code: 146,
      nomeBanco: 'GUITTA CORRETORA DE CAMBIO LTDA.',
    },
    {
      code: 149,
      nomeBanco: 'Facta Financeira S.A. – Crédito Financiamento e Investimento',
    },
    {
      code: 157,
      nomeBanco:
        'ICAP do Brasil Corretora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: 159,
      nomeBanco:
        'Casa do Crédito S.A. Sociedade de Crédito ao Microempreendedor',
    },
    {
      code: 163,
      nomeBanco: 'Commerzbank Brasil S.A. – Banco Múltiplo',
    },
    {
      code: 169,
      nomeBanco: 'Banco Olé Bonsucesso Consignado S.A.',
    },
    {
      code: 173,
      nomeBanco:
        'BRL Trust Distribuidora de Títulos e Valores Mobiliários S.A.',
    },
    {
      code: 174,
      nomeBanco:
        'PERNAMBUCANAS FINANCIADORA S.A. – CRÉDITO, FINANCIAMENTO E INVESTIMENTO',
    },
    {
      code: 177,
      nomeBanco: 'Guide Investimentos S.A. Corretora de Valores',
    },
    {
      code: 180,
      nomeBanco:
        'CM CAPITAL MARKETS CORRETORA DE CÂMBIO, TÍTULOS E VALORES MOBILIÁRIOS LTDA',
    },
    {
      code: 183,
      nomeBanco:
        'SOCRED S.A. – SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO P',
    },
    {
      code: 184,
      nomeBanco: 'Banco Itaú BBA S.A.',
    },
    {
      code: 188,
      nomeBanco:
        'ATIVA INVESTIMENTOS S.A. CORRETORA DE TÍTULOS, CÂMBIO E VALORES',
    },
    {
      code: 189,
      nomeBanco: 'HS FINANCEIRA S/A CREDITO, FINANCIAMENTO E INVESTIMENTOS',
    },
    {
      code: 190,
      nomeBanco:
        'SERVICOOP – COOPERATIVA DE CRÉDITO DOS SERVIDORES PÚBLICOS ESTADUAIS DO RIO GRAN',
    },
    {
      code: 191,
      nomeBanco: 'Nova Futura Corretora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: 194,
      nomeBanco: 'PARMETAL DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA',
    },
    {
      code: 196,
      nomeBanco: 'FAIR CORRETORA DE CAMBIO S.A.',
    },
    {
      code: 197,
      nomeBanco: 'Stone Pagamentos S.A.',
    },
    {
      code: 208,
      nomeBanco: 'Banco BTG Pactual S.A.',
    },
    {
      code: 212,
      nomeBanco: 'Banco Original S.A.',
    },
    {
      code: 213,
      nomeBanco: 'Banco Arbi S.A.',
    },
    {
      code: 217,
      nomeBanco: 'Banco John Deere S.A.',
    },
    {
      code: 218,
      nomeBanco: 'Banco BS2 S.A.',
    },
    {
      code: 222,
      nomeBanco: 'Banco Credit Agricole Brasil S.A.',
    },
    {
      code: 224,
      nomeBanco: 'Banco Fibra S.A.',
    },
    {
      code: 233,
      nomeBanco: 'Banco Cifra S.A.',
    },
    {
      code: 237,
      nomeBanco: 'Banco Bradesco S.A.',
    },
    {
      code: 241,
      nomeBanco: 'Banco Clássico S.A.',
    },
    {
      code: 243,
      nomeBanco: 'Banco Máxima S.A.',
    },
    {
      code: 246,
      nomeBanco: 'Banco ABC Brasil S.A.',
    },
    {
      code: 249,
      nomeBanco: 'Banco Investcred Unibanco S.A.',
    },
    {
      code: 250,
      nomeBanco: 'BCV – Banco de Crédito e Varejo S.A.',
    },
    {
      code: 253,
      nomeBanco: 'Bexs Corretora de Câmbio S/A',
    },
    {
      code: 254,
      nomeBanco: 'Paraná Banco S.A.',
    },
    {
      code: 259,
      nomeBanco: 'MONEYCORP BANCO DE CÂMBIO S.A.',
    },
    {
      code: 260,
      nomeBanco: 'Nu Pagamentos S.A.',
    },
    {
      code: 265,
      nomeBanco: 'Banco Fator S.A.',
    },
    {
      code: 266,
      nomeBanco: 'Banco Cédula S.A.',
    },
    {
      code: 268,
      nomeBanco: 'BARI COMPANHIA HIPOTECÁRIA',
    },
    {
      code: 269,
      nomeBanco: 'HSBC Brasil S.A. – Banco de Investimento',
    },
    {
      code: 270,
      nomeBanco: 'Sagitur Corretora de Câmbio Ltda.',
    },
    {
      code: 271,
      nomeBanco: 'IB Corretora de Câmbio, Títulos e Valores Mobiliários S.A.',
    },
    {
      code: 272,
      nomeBanco: 'AGK CORRETORA DE CAMBIO S.A.',
    },
    {
      code: 273,
      nomeBanco:
        'Cooperativa de Crédito Rural de São Miguel do Oeste – Sulcredi/São Miguel',
    },
    {
      code: 274,
      nomeBanco:
        'MONEY PLUS SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E A EMPRESA DE PEQUENO PORT',
    },
    {
      code: 276,
      nomeBanco: 'Senff S.A. – Crédito, Financiamento e Investimento',
    },
    {
      code: 278,
      nomeBanco: 'Genial Investimentos Corretora de Valores Mobiliários S.A.',
    },
    {
      code: 279,
      nomeBanco: 'COOPERATIVA DE CREDITO RURAL DE PRIMAVERA DO LESTE',
    },
    {
      code: 280,
      nomeBanco: 'Avista S.A. Crédito, Financiamento e Investimento',
    },
    {
      code: 281,
      nomeBanco: 'Cooperativa de Crédito Rural Coopavel',
    },
    {
      code: 283,
      nomeBanco:
        'RB CAPITAL INVESTIMENTOS DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LIMITADA',
    },
    {
      code: 285,
      nomeBanco: 'Frente Corretora de Câmbio Ltda.',
    },
    {
      code: 286,
      nomeBanco: 'COOPERATIVA DE CRÉDITO RURAL DE OURO SULCREDI/OURO',
    },
    {
      code: 288,
      nomeBanco: 'CAROL DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA.',
    },
    {
      code: 289,
      nomeBanco: 'DECYSEO CORRETORA DE CAMBIO LTDA.',
    },
    {
      code: 290,
      nomeBanco: 'Pagseguro Internet S.A.',
    },
    {
      code: 292,
      nomeBanco: 'BS2 Distribuidora de Títulos e Valores Mobiliários S.A.',
    },
    {
      code: 293,
      nomeBanco:
        'Lastro RDV Distribuidora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: 296,
      nomeBanco: 'VISION S.A. CORRETORA DE CAMBIO',
    },
    {
      code: 298,
      nomeBanco: 'Vip’s Corretora de Câmbio Ltda.',
    },
    {
      code: 299,
      nomeBanco: 'SOROCRED CRÉDITO, FINANCIAMENTO E INVESTIMENTO S.A.',
    },
    {
      code: 300,
      nomeBanco: 'Banco de La Nacion Argentina',
    },
    {
      code: 301,
      nomeBanco: 'BPP Instituição de Pagamento S.A.',
    },
    {
      code: 306,
      nomeBanco:
        'PORTOPAR DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA.',
    },
    {
      code: 307,
      nomeBanco:
        'Terra Investimentos Distribuidora de Títulos e Valores Mobiliários Ltda.',
    },
    {
      code: 309,
      nomeBanco: 'CAMBIONET CORRETORA DE CÂMBIO LTDA.',
    },
    {
      code: 310,
      nomeBanco: 'VORTX DISTRIBUIDORA DE TITULOS E VALORES MOBILIARIOS LTDA.',
    },
    {
      code: 315,
      nomeBanco: 'PI Distribuidora de Títulos e Valores Mobiliários S.A.',
    },
    {
      code: 318,
      nomeBanco: 'Banco BMG S.A.',
    },
    {
      code: 319,
      nomeBanco: 'OM DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA',
    },
    {
      code: 320,
      nomeBanco: 'China Construction Bank (Brasil) Banco Múltiplo S.A.',
    },
    {
      code: 321,
      nomeBanco:
        'CREFAZ SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E A EMPRESA DE PEQUENO PORTE LT',
    },
    {
      code: 322,
      nomeBanco:
        'Cooperativa de Crédito Rural de Abelardo Luz – Sulcredi/Crediluz',
    },
    {
      code: 323,
      nomeBanco: 'MERCADOPAGO.COM REPRESENTACOES LTDA.',
    },
    {
      code: 325,
      nomeBanco: 'Órama Distribuidora de Títulos e Valores Mobiliários S.A.',
    },
    {
      code: 326,
      nomeBanco: 'PARATI – CREDITO, FINANCIAMENTO E INVESTIMENTO S.A.',
    },
    {
      code: 329,
      nomeBanco: 'QI Sociedade de Crédito Direto S.A.',
    },
    {
      code: 330,
      nomeBanco: 'Banco Bari de Investimentos e Financiamentos S/A',
    },
    {
      code: 331,
      nomeBanco:
        'Fram Capital Distribuidora de Títulos e Valores Mobiliários S.A.',
    },
    {
      code: 332,
      nomeBanco: 'Acesso Soluções de Pagamento S.A.',
    },
    {
      code: 335,
      nomeBanco: 'Banco Digio S.A.',
    },
    {
      code: 336,
      nomeBanco: 'Banco C6 S.A.',
    },
    {
      code: 340,
      nomeBanco: 'Super Pagamentos e Administração de Meios Eletrônicos S.A.',
    },
    {
      code: 341,
      nomeBanco: 'Itaú Unibanco S.A.',
    },
    {
      code: 342,
      nomeBanco: 'Creditas Sociedade de Crédito Direto S.A.',
    },
    {
      code: 343,
      nomeBanco:
        'FFA SOCIEDADE DE CRÉDITO AO MICROEMPREENDEDOR E À EMPRESA DE PEQUENO PORTE LTDA.',
    },
    {
      code: 348,
      nomeBanco: 'Banco XP S.A.',
    },
    {
      code: 349,
      nomeBanco: 'AMAGGI S.A. – CRÉDITO, FINANCIAMENTO E INVESTIMENTO',
    },
    {
      code: 352,
      nomeBanco: 'TORO CORRETORA DE TÍTULOS E VALORES MOBILIÁRIOS LTDA',
    },
    {
      code: 354,
      nomeBanco:
        'NECTON INVESTIMENTOS S.A. CORRETORA DE VALORES MOBILIÁRIOS E COMMODITIES',
    },
    {
      code: 355,
      nomeBanco: 'ÓTIMO SOCIEDADE DE CRÉDITO DIRETO S.A.',
    },
    {
      code: 364,
      nomeBanco: 'GERENCIANET PAGAMENTOS DO BRASIL LTDA',
    },
    {
      code: 365,
      nomeBanco: 'SOLIDUS S.A. CORRETORA DE CAMBIO E VALORES MOBILIARIOS',
    },
    {
      code: 366,
      nomeBanco: 'Banco Société Générale Brasil S.A.',
    },
    {
      code: 367,
      nomeBanco: 'VITREO DISTRIBUIDORA DE TÍTULOS E VALORES MOBILIÁRIOS S.A.',
    },
    {
      code: 370,
      nomeBanco: 'Banco Mizuho do Brasil S.A.',
    },
    {
      code: 373,
      nomeBanco: 'UP.P SOCIEDADE DE EMPRÉSTIMO ENTRE PESSOAS S.A.',
    },
    {
      code: 376,
      nomeBanco: 'Banco J. P. Morgan S.A.',
    },
    {
      code: 389,
      nomeBanco: 'Banco Mercantil do Brasil S.A.',
    },
    {
      code: 394,
      nomeBanco: 'Banco Bradesco Financiamentos S.A.',
    },
    {
      code: 399,
      nomeBanco: 'Kirton Bank S.A. – Banco Múltiplo',
    },
    {
      code: 412,
      nomeBanco: 'Banco Capital S.A.',
    },
    {
      code: 422,
      nomeBanco: 'Banco Safra S.A.',
    },
    {
      code: 456,
      nomeBanco: 'Banco MUFG Brasil S.A.',
    },
    {
      code: 464,
      nomeBanco: 'Banco Sumitomo Mitsui Brasileiro S.A.',
    },
    {
      code: 473,
      nomeBanco: 'Banco Caixa Geral – Brasil S.A.',
    },
    {
      code: 477,
      nomeBanco: 'Citibank N.A.',
    },
    {
      code: 479,
      nomeBanco: 'Banco ItauBank S.A',
    },
    {
      code: 487,
      nomeBanco: 'Deutsche Bank S.A. – Banco Alemão',
    },
    {
      code: 488,
      nomeBanco: 'JPMorgan Chase Bank',
    },
    {
      code: 492,
      nomeBanco: 'ING Bank N.V.',
    },
    {
      code: 495,
      nomeBanco: 'Banco de La Provincia de Buenos Aires',
    },
    {
      code: 505,
      nomeBanco: 'Banco Credit Suisse (Brasil) S.A.',
    },
    {
      code: 545,
      nomeBanco: 'SENSO CORRETORA DE CAMBIO E VALORES MOBILIARIOS S.A',
    },
    {
      code: 600,
      nomeBanco: 'Banco Luso Brasileiro S.A.',
    },
    {
      code: 604,
      nomeBanco: 'Banco Industrial do Brasil S.A.',
    },
    {
      code: 610,
      nomeBanco: 'Banco VR S.A.',
    },
    {
      code: 611,
      nomeBanco: 'Banco Paulista S.A.',
    },
    {
      code: 612,
      nomeBanco: 'Banco Guanabara S.A.',
    },
    {
      code: 613,
      nomeBanco: 'Omni Banco S.A.',
    },
    {
      code: 623,
      nomeBanco: 'Banco PAN S.A.',
    },
    {
      code: 626,
      nomeBanco: 'Banco Ficsa S.A.',
    },
    {
      code: 630,
      nomeBanco: 'Banco Smartbank S.A.',
    },
    {
      code: 633,
      nomeBanco: 'Banco Rendimento S.A.',
    },
    {
      code: 634,
      nomeBanco: 'Banco Triângulo S.A.',
    },
    {
      code: 637,
      nomeBanco: 'Banco Sofisa S.A.',
    },
    {
      code: 643,
      nomeBanco: 'Banco Pine S.A.',
    },
    {
      code: 652,
      nomeBanco: 'Itaú Unibanco Holding S.A.',
    },
    {
      code: 653,
      nomeBanco: 'Banco Indusval S.A.',
    },
    {
      code: 654,
      nomeBanco: 'Banco A.J.Renner S.A.',
    },
    {
      code: 655,
      nomeBanco: 'Banco Votorantim S.A.',
    },
    {
      code: 707,
      nomeBanco: 'Banco Daycoval S.A.',
    },
    {
      code: 712,
      nomeBanco: 'Banco Ourinvest S.A.',
    },
    {
      code: 739,
      nomeBanco: 'Banco Cetelem S.A.',
    },
    {
      code: 741,
      nomeBanco: 'Banco Ribeirão Preto S.A.',
    },
    {
      code: 743,
      nomeBanco: 'Banco Semear S.A.',
    },
    {
      code: 745,
      nomeBanco: 'Banco Citibank S.A.',
    },
    {
      code: 746,
      nomeBanco: 'Banco Modal S.A.',
    },
    {
      code: 747,
      nomeBanco: 'Banco Rabobank International Brasil S.A.',
    },
    {
      code: 748,
      nomeBanco: 'Banco Cooperativo Sicredi S.A.',
    },
    {
      code: 751,
      nomeBanco: 'Scotiabank Brasil S.A. Banco Múltiplo',
    },
    {
      code: 752,
      nomeBanco: 'Banco BNP Paribas Brasil S.A.',
    },
    {
      code: 753,
      nomeBanco: 'Novo Banco Continental S.A. – Banco Múltiplo',
    },
    {
      code: 754,
      nomeBanco: 'Banco Sistema S.A.',
    },
    {
      code: 755,
      nomeBanco: 'Bank of America Merrill Lynch Banco Múltiplo S.A.',
    },
    {
      code: 756,
      nomeBanco: 'Banco Cooperativo do Brasil S.A. – BANCOOB',
    },
    {
      code: 757,
      nomeBanco: 'Banco KEB HANA do Brasil S.A.',
    },
  ];

  public async run() {
    await Bank.fetchOrCreateMany(
      'code',
      this.BASE.map(bank => ({
        code: bank.code.toString(),
        name: bank.nomeBanco,
      })),
    );
  }
}
