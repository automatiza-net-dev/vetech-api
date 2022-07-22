import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import TimelineType, {
  DOCUMENT_UUID,
  PATHOLOGY_UUID,
  RECIPE_UUID,
} from 'App/Models/TimelineType';

export default class extends BaseSeeder {
  private BASE: Array<Partial<TimelineType>> = [
    {
      id: PATHOLOGY_UUID,
      description: 'Patologia',
      color: '#000',
      requiresObservation: false,
    },
    {
      id: DOCUMENT_UUID,
      description: 'Documento',
      color: '#000',
      requiresObservation: false,
    },
    {
      id: RECIPE_UUID,
      description: 'Formato Receita Médica',
      color: '#000',
      requiresObservation: false,
    },
  ];

  public async run() {
    await TimelineType.fetchOrCreateMany('id', this.BASE);
  }
}
