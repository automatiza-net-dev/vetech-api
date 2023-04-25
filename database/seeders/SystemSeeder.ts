import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import System from 'App/Models/System';

export default class extends BaseSeeder {
  BASE = ['Sanclá', 'LiftOne', 'Vetech'];

  public async run() {
    await System.fetchOrCreateMany(
      'name',
      this.BASE.map(name => ({ name, active: true })),
    );
  }
}
