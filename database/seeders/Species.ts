import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Specie from 'App/Models/Specie';
import { v4 } from 'uuid';

export default class extends BaseSeeder {
  BASE = ['Canina', 'Felina'];

  public async run() {
    await Specie.fetchOrCreateMany(
      'description',
      this.BASE.map(elem => ({
        id: v4(),
        description: elem,
      })),
    );
  }
}
