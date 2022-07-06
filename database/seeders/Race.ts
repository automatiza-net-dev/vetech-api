import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import EconomicGroup from 'App/Models/EconomicGroup';
import Race from 'App/Models/Race';
import Specie from 'App/Models/Specie';
import { v4 } from 'uuid';

export default class extends BaseSeeder {
  public async run() {
    const species = await Specie.all();
    const groups = await EconomicGroup.all();

    const raceCount = (await Race.query()).length;

    const randomNumber = (min: number, max: number) =>
      Math.ceil(min + Math.random() * max);

    const randomSpecie = (entities: Array<Specie>): string | undefined => {
      return entities[Math.floor(Math.random() * entities.length)].id;
    };

    const randomEconomicGroup = (
      entities: Array<EconomicGroup>,
    ): string | undefined => {
      if (Math.random() * 10 >= 5) {
        return undefined;
      }

      return entities[Math.floor(Math.random() * entities.length)].id;
    };

    const data = Array.from({ length: randomNumber(1, 20) }, (_, v) => ({
      id: v4(),
      description: `Raça ${raceCount + v + 1}`,
      specie_id: randomSpecie(species),
      economic_group_id: randomEconomicGroup(groups),
      code: v4(),
    }));

    await Race.createMany(data);
  }
}
