import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import UserFactory from 'Database/factories/UserFactory';

export default class extends BaseSeeder {
  public async run() {
    await UserFactory.create();
    // Write your database queries inside the run method
  }
}
