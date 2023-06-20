import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ThirdPartyUser from 'App/Models/ThirdPartyUser';
import ThirdPartyUserPermission from 'App/Models/ThirdPartyUserPermission';
import { v4 } from 'uuid';
import Hash from '@ioc:Adonis/Core/Hash';
import { userBootstrap } from '../utils';

test.group('Third party resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, system } = await userBootstrap();

    const tpUser = await ThirdPartyUser.create({
      name: 'Test',
    });

    const tpPermission = await ThirdPartyUserPermission.create({
      key: v4(),
      user_id: tpUser.id,
      password: await Hash.make('102030'),
      system_id: system.id,
    });

    return { user, tpUser, tpPermission };
  };

  test('should authenticate', async ({ client, assert }) => {
    const { tpPermission } = await createData();

    const response = await client.post('/external/authenticate').json({
      key: tpPermission.key,
      password: '102030',
      systemId: tpPermission.system_id,
    });

    console.log(response.body());

    assert.equal(response.status(), 200);
  });
});
