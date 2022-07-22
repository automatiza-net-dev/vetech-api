import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import TimelineType from 'App/Models/TimelineType';

export default class extends BaseSeeder {
  private BASE: Array<Partial<TimelineType>> = [
    {
      description: 'Type 1',
      color: '#000',
      requiresObservation: false,
    },
    {
      description: 'Type 2',
      color: '#000',
      requiresObservation: false,
    },
    {
      description: 'Type 3',
      color: '#000',
      requiresObservation: false,
    },
  ];

  public async run() {
    await TimelineType.fetchOrCreateMany('description', this.BASE);
  }
}
