import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ThirdPartyUser from 'App/Models/ThirdPartyUser';
import ThirdPartyUserPermission from 'App/Models/ThirdPartyUserPermission';
import { v4 } from 'uuid';
import Hash from '@ioc:Adonis/Core/Hash';
import { userBootstrap } from '../utils';
import { ApiClient } from '@japa/api-client';
import System from 'App/Models/System';

test.group('Third party resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (systemName: string) => {
    const { user } = await userBootstrap();

    const tpUser = await ThirdPartyUser.create({
      name: 'Test',
    });

    const system = await System.create({
      name: systemName,
    });

    const tpPermission = await ThirdPartyUserPermission.create({
      key: v4(),
      user_id: tpUser.id,
      password: await Hash.make('102030'),
      system_id: system.id,
    });

    return { user, tpUser, tpPermission };
  };

  const createToken = async (
    client: ApiClient,
    tpPermission: ThirdPartyUserPermission,
    systemName: string,
  ) => {
    const response = await client
      .post(`/external/authenticate-${systemName.toLowerCase()}`)
      .json({
        key: tpPermission.key,
        password: '102030',
        systemId: tpPermission.system_id,
      });

    return response.body().token;
  };

  test('should authenticate', async ({ client, assert }) => {
    const { tpPermission } = await createData('Vetech');

    const response = await client.post('/external/authenticate-vetech').json({
      key: tpPermission.key,
      password: '102030',
      systemId: tpPermission.system_id,
    });

    assert.equal(response.status(), 200);
  });

  test('should get profile', async ({ client, assert }) => {
    const { tpPermission } = await createData('Vetech');
    const token = await createToken(client, tpPermission, 'vetech');

    const response = await client.get('/external/profile').bearerToken(token);

    assert.equal(response.status(), 200);
  });
});
