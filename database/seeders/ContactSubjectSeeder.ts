import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import ContactSubject from 'App/Models/ContactSubject';

export default class extends BaseSeeder {
  public async run() {
    const data = [
      {
        description: 'Castração',
        type: 'crm',
      },
      {
        description: 'Cirurgia',
        type: 'crm',
      },
      {
        description: 'Cirurgia Ortopédica',
        type: 'crm',
      },
      {
        description: 'Consulta Plantão',
        type: 'crm',
      },
      {
        description: 'Consulta Rotina',
        type: 'crm',
      },
      {
        description: 'Convênio',
        type: 'crm',
      },
      {
        description: 'Emergência',
        type: 'crm',
      },
      {
        description: 'Engano',
        type: 'crm',
      },
      {
        description: 'Especialistas',
        type: 'crm',
      },
      {
        description: 'Exames – Outros',
        type: 'crm',
      },
      {
        description: 'Exames – Valores',
        type: 'crm',
      },
      {
        description: 'Internação',
        type: 'crm',
      },
      {
        description: 'Já é Cliente',
        type: 'crm',
      },
      {
        description: 'Localização',
        type: 'crm',
      },
      {
        description: 'Microchipagem',
        type: 'crm',
      },
      {
        description: 'Não Informado',
        type: 'crm',
      },
      {
        description: 'Outros',
        type: 'crm',
      },
      {
        description: 'Profilaxia Dentária',
        type: 'crm',
      },
      {
        description: 'Protocolo de Viagem',
        type: 'crm',
      },
      {
        description: 'Vacinação',
        type: 'crm',
      },
    ];

    await ContactSubject.fetchOrCreateMany(
      'description',
      data.map(elem => ({
        ...elem,
        active: true,
      })),
    );
  }
}
