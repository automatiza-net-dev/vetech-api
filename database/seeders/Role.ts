import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Role from 'App/Models/Role';

export default class extends BaseSeeder {
  protected BASE_ROLES = [
    'admin',
    'manager',
    'veterinary',
    'attendant',
    'clerk',
    'seller',
  ];

  public async run() {
    const partialRoles = this.BASE_ROLES.map(role => ({
      name: role,
    }));
    await Role.fetchOrCreateMany('name', partialRoles);
    // Write your database queries inside the run method
  }
}
