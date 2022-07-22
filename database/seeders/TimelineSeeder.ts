import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import TimelineType from 'App/Models/TimelineType';

export default class extends BaseSeeder {
  private BASE: Array<Partial<TimelineType>> = [
    {
      description: 'Patologia',
      color: '#000',
      requiresObservation: false,
    },
    {
      description: 'Documento',
      color: '#000',
      requiresObservation: false,
    },
    {
      description: 'Formato Receita Médica',
      color: '#000',
      requiresObservation: false,
    },
  ];

  public async run() {
    await TimelineType.fetchOrCreateMany('description', this.BASE);
  }
}
