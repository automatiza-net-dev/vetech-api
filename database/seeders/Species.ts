import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Specie from 'App/Models/Specie';
import { v4 } from 'uuid';

export default class extends BaseSeeder {
  public async run() {
    const BASE_SPECIES = Array.from({ length: 5 }, (_, v) => ({
      id: v4(),
      description: `Espécie ${v + 1}`,
    }));

    await Specie.fetchOrCreateMany('description', BASE_SPECIES);
  }
}
