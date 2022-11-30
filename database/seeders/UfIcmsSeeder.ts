import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import UfIcms from 'App/Models/UfIcms';
import { DateTime } from 'luxon';

const UFKeys = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;

type T = {
  destination: typeof UFKeys[number];
  icms: number;
  fcp: number;
};

type TRecord = Record<typeof UFKeys[number], T>;

export default class extends BaseSeeder {
  private BASE: Record<typeof UFKeys[number], TRecord> = {
    AC: {
      AC: {
        destination: 'AC',
        icms: 17,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    AL: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 17,
        fcp: 1,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    AM: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 18,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    AP: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 18,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    BA: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 18,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    CE: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 17,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    DF: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 18,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    ES: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 17,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    GO: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 17,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    MA: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 18,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    MG: {
      AC: {
        destination: 'AC',
        icms: 7,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 7,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 7,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 7,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 7,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 7,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 7,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 7,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 7,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 7,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 18,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 7,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 7,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 7,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 7,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 7,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 7,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 7,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 7,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 7,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 7,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 7,
        fcp: 0,
      },
    },
    MS: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 17,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    MT: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 17,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    PA: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 17,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    PB: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 18,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    PE: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 18,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    PI: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 17,
        fcp: 1,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    PR: {
      AC: {
        destination: 'AC',
        icms: 7,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 7,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 7,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 7,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 7,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 7,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 7,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 7,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 7,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 7,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 7,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 7,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 7,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 7,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 7,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 7,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 18,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 7,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 7,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 7,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 7,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 7,
        fcp: 0,
      },
    },
    RJ: {
      AC: {
        destination: 'AC',
        icms: 7,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 7,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 7,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 7,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 7,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 7,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 7,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 7,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 7,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 7,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 7,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 7,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 7,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 7,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 7,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 7,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 18,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 7,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 7,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 7,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 7,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 7,
        fcp: 0,
      },
    },
    RN: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 18,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    RO: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 17.5,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    RR: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 17,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    RS: {
      AC: {
        destination: 'AC',
        icms: 7,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 7,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 7,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 7,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 7,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 7,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 7,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 7,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 7,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 7,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 7,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 7,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 7,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 7,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 7,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 7,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 7,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 7,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 7,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 7,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 17.5,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 7,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 7,
        fcp: 0,
      },
    },
    SC: {
      AC: {
        destination: 'AC',
        icms: 7,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 7,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 7,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 7,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 7,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 7,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 7,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 7,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 7,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 7,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 7,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 7,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 7,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 7,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 7,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 7,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 7,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 7,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 7,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 17,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 7,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 7,
        fcp: 0,
      },
    },
    SE: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 18,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 12,
        fcp: 0,
      },
    },
    SP: {
      AC: {
        destination: 'AC',
        icms: 7,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 7,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 7,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 7,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 7,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 7,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 7,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 7,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 7,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 7,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 7,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 7,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 7,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 7,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 7,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 7,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 7,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 7,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 7,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 7,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 18,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 7,
        fcp: 0,
      },
    },
    TO: {
      AC: {
        destination: 'AC',
        icms: 12,
        fcp: 0,
      },
      AL: {
        destination: 'AL',
        icms: 12,
        fcp: 0,
      },
      AM: {
        destination: 'AM',
        icms: 12,
        fcp: 0,
      },
      AP: {
        destination: 'AP',
        icms: 12,
        fcp: 0,
      },
      BA: {
        destination: 'BA',
        icms: 12,
        fcp: 0,
      },
      CE: {
        destination: 'CE',
        icms: 12,
        fcp: 0,
      },
      DF: {
        destination: 'DF',
        icms: 12,
        fcp: 0,
      },
      ES: {
        destination: 'ES',
        icms: 12,
        fcp: 0,
      },
      GO: {
        destination: 'GO',
        icms: 12,
        fcp: 0,
      },
      MA: {
        destination: 'MA',
        icms: 12,
        fcp: 0,
      },
      MG: {
        destination: 'MG',
        icms: 12,
        fcp: 0,
      },
      MS: {
        destination: 'MS',
        icms: 12,
        fcp: 0,
      },
      MT: {
        destination: 'MT',
        icms: 12,
        fcp: 0,
      },
      PA: {
        destination: 'PA',
        icms: 12,
        fcp: 0,
      },
      PB: {
        destination: 'PB',
        icms: 12,
        fcp: 0,
      },
      PE: {
        destination: 'PE',
        icms: 12,
        fcp: 0,
      },
      PI: {
        destination: 'PI',
        icms: 12,
        fcp: 0,
      },
      PR: {
        destination: 'PR',
        icms: 12,
        fcp: 0,
      },
      RJ: {
        destination: 'RJ',
        icms: 12,
        fcp: 0,
      },
      RN: {
        destination: 'RN',
        icms: 12,
        fcp: 0,
      },
      RO: {
        destination: 'RO',
        icms: 12,
        fcp: 0,
      },
      RR: {
        destination: 'RR',
        icms: 12,
        fcp: 0,
      },
      RS: {
        destination: 'RS',
        icms: 12,
        fcp: 0,
      },
      SC: {
        destination: 'SC',
        icms: 12,
        fcp: 0,
      },
      SE: {
        destination: 'SE',
        icms: 12,
        fcp: 0,
      },
      SP: {
        destination: 'SP',
        icms: 12,
        fcp: 0,
      },
      TO: {
        destination: 'TO',
        icms: 18,
        fcp: 0,
      },
    },
  };

  public async run() {
    // Cleanup
    await UfIcms.query().delete();

    const from = DateTime.now().startOf('year');
    const to = DateTime.now().endOf('year');

    const payload: Array<Partial<UfIcms>> = [
      {
        validFrom: from,
        validTo: to,
        originUf: 'EX',
        destinationUf: 'EX',
        icmsPercentage: 4,
        fcpIcms: 0,
        active: true,
      },
    ];

    // eslint-disable-next-line no-restricted-syntax
    for (const key of UFKeys) {
      const elems = this.BASE[key];

      // eslint-disable-next-line no-restricted-syntax
      for (const elem of Object.values(elems)) {
        payload.push({
          validFrom: from,
          validTo: to,
          originUf: key,
          destinationUf: elem.destination,
          icmsPercentage: elem.icms,
          fcpIcms: elem.fcp,
          active: true,
        });
      }
    }

    await UfIcms.createMany(payload);
  }
}
