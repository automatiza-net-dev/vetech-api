import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import PermissionFactory from 'Database/factories/PermissionFactory';

export default class extends BaseSeeder {
  public async run() {
    await PermissionFactory.createMany(5);
  }
}
