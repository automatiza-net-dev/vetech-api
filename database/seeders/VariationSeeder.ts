import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Variation, {
  COLOR_VARIATION,
  SIZE_VARIATION,
  VOLTAGE_VARIATION,
} from 'App/Models/Variation';

export default class extends BaseSeeder {
  private BASE: Array<Partial<Variation>> = [
    {
      id: COLOR_VARIATION,
      description: 'Cor',
      active: true,
    },
    {
      id: SIZE_VARIATION,
      description: 'Tamanho',
      active: true,
    },
    {
      id: VOLTAGE_VARIATION,
      description: 'Voltagem',
      active: true,
    },
  ];

  public async run() {
    await Variation.fetchOrCreateMany('id', this.BASE);
  }
}
