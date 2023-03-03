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
  ];
  public async run() {
    await TemplateReplacement.fetchOrCreateMany('replacer', this.BASE);
  }
}
