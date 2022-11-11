import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import TefAcquirer from 'App/Models/TefAcquirer';
import TefFlag, { TefFlagType } from 'App/Models/TefFlag';

export default class extends BaseSeeder {
  FLAG_BASE: Array<Partial<TefFlag>> = [
    { code: '1', description: 'AMEX', type: TefFlagType.A },
    { code: '2', description: 'AURA', type: TefFlagType.C },
    { code: '3', description: 'MASTERCARD', type: TefFlagType.A },
    { code: '4', description: 'HIPERCARD', type: TefFlagType.A },
    { code: '5', description: 'VISA', type: TefFlagType.C },
    { code: '6', description: 'MAESTRO', type: TefFlagType.D },
    { code: '7', description: 'ELECTRON', type: TefFlagType.D },
    { code: '8', description: 'SOROCRED', type: TefFlagType.C },
    { code: '9', description: 'OI PAGGO', type: TefFlagType.C },
    { code: '10', description: 'Dacasa', type: TefFlagType.C },
    { code: '11', description: 'GOODCARD', type: TefFlagType.C },
    { code: '12', description: 'ELO', type: TefFlagType.A },
    { code: '13', description: 'DINERS', type: TefFlagType.C },
    { code: '14', description: 'BANRISUL', type: TefFlagType.B },
    { code: '15', description: 'IPIRANGA', type: TefFlagType.A },
    { code: '16', description: 'CONSTRUCARD', type: TefFlagType.C },
    { code: '17', description: 'MAIS', type: TefFlagType.C },
    { code: '18', description: 'BRASIL CONVÊNIOS', type: TefFlagType.B },
    { code: '19', description: 'BANESE', type: TefFlagType.D },
    { code: '20', description: 'CARTAO PJ', type: TefFlagType.A },
    { code: '21', description: 'CABAL', type: TefFlagType.A },
    { code: '22', description: 'CREDSYSTEM', type: TefFlagType.C },
    { code: '23', description: 'CREDZ', type: TefFlagType.C },
    { code: '24', description: 'ELO CREDIÁRIO', type: TefFlagType.C },
    { code: '25', description: 'CREDIARIO', type: TefFlagType.C },
    { code: '26', description: 'CARNE', type: TefFlagType.A },
    { code: '27', description: 'ALELO ALIMENTAÇÃO VISA', type: TefFlagType.B },
    { code: '28', description: 'ALELO ALIMENTAÇÃO ELO', type: TefFlagType.B },
    { code: '29', description: 'ALELO REFEIÇÃO VISA', type: TefFlagType.B },
    { code: '30', description: 'ALELO REFEIÇÃO ELO', type: TefFlagType.B },
    { code: '31', description: 'ALELO AUTO', type: TefFlagType.B },
    { code: '32', description: 'SAQUE ELECTRON', type: TefFlagType.D },
    { code: '33', description: 'SICREDI', type: TefFlagType.A },
    { code: '34', description: 'DISCOVER', type: TefFlagType.D },
    { code: '35', description: 'SODEXHO REFEICAO', type: TefFlagType.B },
    { code: '36', description: 'SODEXHO ALIMENTACAO', type: TefFlagType.B },
    { code: '37', description: 'PREMIUM PASS', type: TefFlagType.B },
    { code: '38', description: 'GET PASS', type: TefFlagType.B },
    { code: '39', description: 'TICKET ALIMENTAÇÃO', type: TefFlagType.B },
    { code: '40', description: 'TICKET REFEIÇÃO', type: TefFlagType.B },
    { code: '41', description: 'COOPERCARD', type: TefFlagType.A },
    { code: '42', description: 'FORTBRASIL', type: TefFlagType.C },
    { code: '43', description: 'TRICARD', type: TefFlagType.C },
    { code: '44', description: 'CREDISHOP', type: TefFlagType.A },
    { code: '45', description: 'AVISTA', type: TefFlagType.A },
    { code: '46', description: 'LIBERCARD', type: TefFlagType.A },
    { code: '47', description: 'SENFF', type: TefFlagType.A },
    { code: '48', description: 'BANRICOMPRAS', type: TefFlagType.A },
    { code: '49', description: 'BONUSCRED', type: TefFlagType.A },
    { code: '50', description: 'CREDSYSTEM', type: TefFlagType.C },
    { code: '51', description: 'VERDECARD', type: TefFlagType.A },
    { code: '52', description: 'CBBank', type: TefFlagType.A },
    { code: '53', description: 'UNIONPAY', type: TefFlagType.A },
    { code: '54', description: 'JCB', type: TefFlagType.A },
    { code: '55', description: 'BRASILCARD', type: TefFlagType.A },
    { code: '56', description: 'BRASIL CARD', type: TefFlagType.A },
    { code: '57', description: 'CALCARD', type: TefFlagType.A },
  ];

  ACQUIRER_BASE: Array<Partial<TefAcquirer>> = [
    {
      description: 'BCARD',
    },
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
      description: 'VISANET',
    },
    {
      description: 'STONE',
    },
    {
      description: 'INFINITEPAY',
    },
  ];

  public async run() {
    // Write your database queries inside the run method

    await TefFlag.fetchOrCreateMany('code', this.FLAG_BASE);
    await TefAcquirer.fetchOrCreateMany('description', this.ACQUIRER_BASE);
  }
}
