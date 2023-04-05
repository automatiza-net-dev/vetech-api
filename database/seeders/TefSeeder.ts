import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import TefAcquirer from 'App/Models/TefAcquirer';
import TefFlag, { TefFlagType } from 'App/Models/TefFlag';

export default class extends BaseSeeder {
  FLAG_BASE: Array<Partial<TefFlag>> = [
    { code: '1', description: 'AMEX', type: TefFlagType.A, nfe_code: '03' },
    { code: '2', description: 'AURA', type: TefFlagType.C, nfe_code: '08' },
    {
      code: '3',
      description: 'MASTERCARD',
      type: TefFlagType.A,
      nfe_code: '02',
    },
    {
      code: '4',
      description: 'HIPERCARD',
      type: TefFlagType.A,
      nfe_code: '07',
    },
    { code: '5', description: 'VISA', type: TefFlagType.C, nfe_code: '01' },
    { code: '6', description: 'MAESTRO', type: TefFlagType.D, nfe_code: '02' },
    { code: '7', description: 'ELECTRON', type: TefFlagType.D, nfe_code: '01' },
    { code: '8', description: 'SOROCRED', type: TefFlagType.C, nfe_code: '04' },
    { code: '9', description: 'OI PAGGO', type: TefFlagType.C, nfe_code: '99' },
    { code: '10', description: 'Dacasa', type: TefFlagType.C, nfe_code: '99' },
    {
      code: '11',
      description: 'GOODCARD',
      type: TefFlagType.C,
      nfe_code: '15',
    },
    { code: '12', description: 'ELO', type: TefFlagType.A, nfe_code: '06' },
    { code: '13', description: 'DINERS', type: TefFlagType.C, nfe_code: '05' },
    {
      code: '14',
      description: 'BANRISUL',
      type: TefFlagType.B,
      nfe_code: '99',
    },
    {
      code: '15',
      description: 'IPIRANGA',
      type: TefFlagType.A,
      nfe_code: '99',
    },
    {
      code: '16',
      description: 'CONSTRUCARD',
      type: TefFlagType.C,
      nfe_code: '99',
    },
    { code: '17', description: 'MAIS', type: TefFlagType.C, nfe_code: '19' },
    {
      code: '18',
      description: 'BRASIL CONVÊNIOS',
      type: TefFlagType.B,
      nfe_code: '99',
    },
    { code: '19', description: 'BANESE', type: TefFlagType.D, nfe_code: '99' },
    {
      code: '20',
      description: 'CARTAO PJ',
      type: TefFlagType.A,
      nfe_code: '99',
    },
    { code: '21', description: 'CABAL', type: TefFlagType.A, nfe_code: '09' },
    {
      code: '22',
      description: 'CREDSYSTEM',
      type: TefFlagType.C,
      nfe_code: '99',
    },
    { code: '23', description: 'CREDZ', type: TefFlagType.C, nfe_code: '13' },
    {
      code: '24',
      description: 'ELO CREDIÁRIO',
      type: TefFlagType.C,
      nfe_code: '06',
    },
    {
      code: '25',
      description: 'CREDIARIO',
      type: TefFlagType.C,
      nfe_code: '99',
    },
    { code: '26', description: 'CARNE', type: TefFlagType.A, nfe_code: '99' },
    {
      code: '27',
      description: 'ALELO ALIMENTAÇÃO VISA',
      type: TefFlagType.B,
      nfe_code: '10',
    },
    {
      code: '28',
      description: 'ALELO ALIMENTAÇÃO ELO',
      type: TefFlagType.B,
      nfe_code: '10',
    },
    {
      code: '29',
      description: 'ALELO REFEIÇÃO VISA',
      type: TefFlagType.B,
      nfe_code: '10',
    },
    {
      code: '30',
      description: 'ALELO REFEIÇÃO ELO',
      type: TefFlagType.B,
      nfe_code: '10',
    },
    {
      code: '31',
      description: 'ALELO AUTO',
      type: TefFlagType.B,
      nfe_code: '10',
    },
    {
      code: '32',
      description: 'SAQUE ELECTRON',
      type: TefFlagType.D,
      nfe_code: '01',
    },
    { code: '33', description: 'SICREDI', type: TefFlagType.A, nfe_code: '99' },
    {
      code: '34',
      description: 'DISCOVER',
      type: TefFlagType.D,
      nfe_code: '14',
    },
    {
      code: '35',
      description: 'SODEXHO REFEICAO',
      type: TefFlagType.B,
      nfe_code: '23',
    },
    {
      code: '36',
      description: 'SODEXHO ALIMENTACAO',
      type: TefFlagType.B,
      nfe_code: '23',
    },
    {
      code: '37',
      description: 'PREMIUM PASS',
      type: TefFlagType.B,
      nfe_code: '99',
    },
    {
      code: '38',
      description: 'GET PASS',
      type: TefFlagType.B,
      nfe_code: '99',
    },
    {
      code: '39',
      description: 'TICKET ALIMENTAÇÃO',
      type: TefFlagType.B,
      nfe_code: '27',
    },
    {
      code: '40',
      description: 'TICKET REFEIÇÃO',
      type: TefFlagType.B,
      nfe_code: '27',
    },
    {
      code: '41',
      description: 'COOPERCARD',
      type: TefFlagType.A,
      nfe_code: '99',
    },
    {
      code: '42',
      description: 'FORTBRASIL',
      type: TefFlagType.C,
      nfe_code: '99',
    },
    { code: '43', description: 'TRICARD', type: TefFlagType.C, nfe_code: '99' },
    {
      code: '44',
      description: 'CREDISHOP',
      type: TefFlagType.A,
      nfe_code: '99',
    },
    { code: '45', description: 'AVISTA', type: TefFlagType.A, nfe_code: '99' },
    {
      code: '46',
      description: 'LIBERCARD',
      type: TefFlagType.A,
      nfe_code: '99',
    },
    { code: '47', description: 'SENFF', type: TefFlagType.A, nfe_code: '99' },
    {
      code: '48',
      description: 'BANRICOMPRAS',
      type: TefFlagType.A,
      nfe_code: '99',
    },
    {
      code: '49',
      description: 'BONUSCRED',
      type: TefFlagType.A,
      nfe_code: '99',
    },
    {
      code: '50',
      description: 'CREDSYSTEM',
      type: TefFlagType.C,
      nfe_code: '99',
    },
    {
      code: '51',
      description: 'VERDECARD',
      type: TefFlagType.A,
      nfe_code: '99',
    },
    { code: '52', description: 'CBBank', type: TefFlagType.A, nfe_code: '99' },
    {
      code: '53',
      description: 'UNIONPAY',
      type: TefFlagType.A,
      nfe_code: '99',
    },
    { code: '54', description: 'JCB', type: TefFlagType.A, nfe_code: '18' },
    {
      code: '55',
      description: 'BRASILCARD',
      type: TefFlagType.A,
      nfe_code: '99',
    },
    {
      code: '56',
      description: 'BRASIL CARD',
      type: TefFlagType.A,
      nfe_code: '99',
    },
    { code: '57', description: 'CALCARD', type: TefFlagType.A, nfe_code: '12' },
  ];

  ACQUIRER_BASE: Array<Partial<TefAcquirer>> = [
    {
      description: 'CIELO',
    },
    {
      description: 'GETNET',
    },
    {
      description: 'REDE',
    },
    {
      description: 'STONE',
    },
  ];

  public async run() {
    // Write your database queries inside the run method

    await TefFlag.fetchOrCreateMany('code', this.FLAG_BASE);
    await TefAcquirer.fetchOrCreateMany('description', this.ACQUIRER_BASE);
  }
}
