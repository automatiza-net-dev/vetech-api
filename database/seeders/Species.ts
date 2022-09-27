import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import EconomicGroup from 'App/Models/EconomicGroup';
import Specie from 'App/Models/Specie';
import { v4 } from 'uuid';

export default class extends BaseSeeder {
  public async run() {
    const speciesCount = (await Specie.all()).length;
    const groups = await EconomicGroup.all();

    const randomEconomicGroup = (
      entities: Array<EconomicGroup>,
    ): string | undefined => {
      if (Math.random() * 10 >= 5) {
        return undefined;
      }

      return entities[Math.floor(Math.random() * entities.length)].id;
    };

    const BASE_SPECIES = Array.from({ length: 5 }, (_, v) => ({
      id: v4(),
      description: `Espécie ${v + 1 + speciesCount}`,
      economic_group_id: randomEconomicGroup(groups),
    }));

    await Specie.fetchOrCreateMany('description', BASE_SPECIES);
  }
}
