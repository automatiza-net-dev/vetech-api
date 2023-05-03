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
    {
      reason: 'Cliente desistiu do Orçamento',
      type: 'OR',
      requiresObservation: false,
    },
    {
      reason: 'Orçamento ficou muito Caro',
      type: 'OR',
      requiresObservation: false,
    },
    {
      reason: 'Outros',
      type: 'OR',
      requiresObservation: true,
    },
    {
      reason: 'Cancelamento Tutor',
      type: 'CA',
      requiresObservation: false,
    },
    {
      reason: 'Cancelamento Clínica',
      type: 'CA',
      requiresObservation: true,
    },
    {
      reason: 'Outros',
      type: 'CA',
      requiresObservation: true,
    },
  ];
  public async run() {
    await Reason.fetchOrCreateMany('reason', this.BASE);
  }
}
