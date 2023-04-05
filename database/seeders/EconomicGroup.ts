import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import EconomicGroupFactory from 'Database/factories/EconomicGroupFactory';

export default class extends BaseSeeder {
  public async run() {
    await EconomicGroupFactory.createMany(1);
  }
}
