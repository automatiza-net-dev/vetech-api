import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import DrugAdministration from 'App/Models/DrugAdministration';

export default class extends BaseSeeder {
  BASE = [
    'Enema',
    'Epidural',
    'Inalatória',
    'Intramuscular',
    'Intraóssea',
    'Intraperitoneal',
    'Intravenosa',
    'Oftálmica',
    'Oral',
    'Otológica',
    'Sonda',
    'Subcutânea',
    'Tópica',
  ];

  public async run() {
    await DrugAdministration.fetchOrCreateMany(
      'description',
      this.BASE.map(elem => ({ description: elem })),
    );
  }
}
