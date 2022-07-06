import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Permission from 'App/Models/Permission';
import Plan from 'App/Models/Plan';
import Role from 'App/Models/Role';
import User from 'App/Models/User';
import { v4 } from 'uuid';

export default class extends BaseSeeder {
  public async run() {
    const [admin] = await User.fetchOrCreateMany('email', [
      {
        name: 'Admin',
        email: 'devs@creativecode.art.br',
        password: 'Master@450',
      },
    ]);

    const newGroup = await admin.related('economicGroups').create({
      id: v4(),
    });

    const newBusinessUnit = await newGroup.related('businessUnits').create({
      id: v4(),
      origin: 'SEED',
    });

    const [superAdminRole] = await Role.fetchOrCreateMany('name', [
      {
        name: 'super_admin',
      },
      {
        name: 'admin',
      },
    ]);

    const [fullPermission] = await Permission.fetchOrCreateMany('name', [
      {
        name: 'FULL_PERMISSION',
      },
    ]);

    await superAdminRole.related('permissions').sync([fullPermission.id]);

    await admin.related('roles').firstOrCreate(
      { role_id: superAdminRole.id },
      {
        role_id: superAdminRole.id,
        unit_id: newBusinessUnit.id,
      },
    );

    await Plan.firstOrCreate(
      {
        default: true,
      },
      {
        default: true,
        id: v4(),
        description: 'Plano padrão',
        trialDays: 10,
        trialAdditional: 2,
      },
    );
  }
}
