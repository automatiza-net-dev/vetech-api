import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import User from 'App/Models/User';

export default class extends BaseSeeder {
  public async run() {
    await User.create({
      email: 'mail@mail.com',
      password: '102030',
      document: '123456789',
    });
    // Write your database queries inside the run method
  }
}
