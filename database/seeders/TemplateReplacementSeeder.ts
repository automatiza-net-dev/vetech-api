import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import TemplateReplacement, {
  TemplateReplacementOrigin,
} from 'App/Models/TemplateReplacement';

export default class extends BaseSeeder {
  BASE: Array<Partial<TemplateReplacement>> = [
    {
      origin: TemplateReplacementOrigin.PATIENT,
      attribute: 'name',
      replacer: '[PACIENTE_NOME]',
    },
    // {
    //   origin: TemplateReplacementOrigin.PATIENT,
    //   attribute: 'rg',
    //   replacer: '[PACIENTE_ID]',
    // },
    {
      origin: TemplateReplacementOrigin.PATIENT,
      attribute: 'gender',
      replacer: '[PACIENTE_SEXO]',
    },
    // {
    //   origin: TemplateReplacementOrigin.PATIENT,
    //   attribute: 'numeric_age',
    //   replacer: '[PACIENTE_IDADE]',
    // },
    // {
    //   origin: TemplateReplacementOrigin.PATIENT,
    //   attribute: 'age',
    //   replacer: '[PACIENTE_NASCIMENTO]',
    // },
    {
      origin: TemplateReplacementOrigin.PATIENT,
      attribute: 'hair',
      replacer: '[PACIENTE_PELAGEM]',
    },
    {
      origin: TemplateReplacementOrigin.PATIENT,
      attribute: 'specie',
      replacer: '[PACIENTE_ESPECIE]',
    },
    {
      origin: TemplateReplacementOrigin.PATIENT,
      attribute: 'race',
      replacer: '[PACIENTE_RACA]',
    },
    {
      origin: TemplateReplacementOrigin.PATIENT,
      attribute: 'weight',
      replacer: '[PACIENTE_PESO]',
    },
    {
      origin: TemplateReplacementOrigin.PATIENT,
      attribute: 'vaccinated',
      replacer: '[PACIENTE_VACINADO]',
    },

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
  ];
  public async run() {
    await TemplateReplacement.fetchOrCreateMany('replacer', this.BASE);
  }
}
