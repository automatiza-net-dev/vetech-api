import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Reason from 'App/Models/Reason';

export default class extends BaseSeeder {
  private BASE: Array<Partial<Reason>> = [
    {
      reason: 'Imprevisto Tutor',
      type: 'RA',
      requiresObservation: false,
    },
    {
      reason: 'Outros',
      type: 'RA',
      requiresObservation: true,
    },
  ];
  public async run() {
    await Reason.fetchOrCreateMany('reason', this.BASE);
  }
}
