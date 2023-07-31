import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ThirdPartyUser from 'App/Models/ThirdPartyUser';
import ThirdPartyUserPermission from 'App/Models/ThirdPartyUserPermission';
import { v4 } from 'uuid';
import Hash from '@ioc:Adonis/Core/Hash';
import { generateJwtToken, userBootstrap } from '../utils';
import { ApiClient } from '@japa/api-client';
import System from 'App/Models/System';
import ProfileAccess from 'App/Models/ProfileAccess';
import Role from 'App/Models/Role';

test.group('Third party resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (systemName?: string) => {
    const {
      user,
      business,
      group,
      system: defaultSystem,
    } = await userBootstrap();

    const tpUser = await ThirdPartyUser.create({
      name: 'Test',
    });

    const system = systemName
      ? await System.create({
          name: systemName,
        })
      : defaultSystem;

    const role = await Role.create({
      name: v4(),
      system_id: system.id,
      economic_group_id: group.id,
      type: 'system',
    });

    if (systemName) {
      await user.merge({ system_id: system.id }).save();
    }

    const tpPermission = await ThirdPartyUserPermission.create({
      key: v4(),
      user_id: tpUser.id,
      password: await Hash.make('102030'),
      system_id: system.id,
    });

    return { user, tpUser, tpPermission, business, system, role };
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
      });

    return response.body().token;
  };

  test('should authenticate', async ({ client, assert }) => {
    const { tpPermission } = await createData('Vetech');

    const response = await client.post('/external/authenticate-vetech').json({
      key: tpPermission.key,
      password: '102030',
    });

    assert.equal(response.status(), 200);
  });

  test('should get profile', async ({ client, assert }) => {
    const { tpPermission } = await createData('Vetech');
    const token = await createToken(client, tpPermission, 'vetech');

    const response = await client.get('/external/profile').bearerToken(token);

    assert.equal(response.status(), 200);
  });

  test('should extended authenticate', async ({ client, assert }) => {
    const { tpPermission, user } = await createData('Vetech');

    const response = await client
      .post('/external/extended-authenticate-vetech')
      .json({
        appKey: tpPermission.key,
        appPassword: '102030',

        userEmail: user.email,
        userPassword: '102030',
      });

    assert.equal(response.status(), 200);
  });

  test('should get unit info', async ({ client, assert }) => {
    const { tpPermission, business } = await createData('Vetech');
    const token = await createToken(client, tpPermission, 'vetech');

    const response = await client
      .get(`/external/business/${business.id}`)
      .bearerToken(token);

    assert.equal(response.status(), 200);
  });

  test('should get user info', async ({ client, assert }) => {
    const { tpPermission, user } = await createData('Vetech');
    const token = await createToken(client, tpPermission, 'vetech');

    const response = await client
      .get(`/external/user/${user.id}`)
      .bearerToken(token);

    assert.equal(response.status(), 200);
  });

  test('should get profiles', async ({ client, assert }) => {
    const { system, user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
      systemName: system.name,
    });

    await ProfileAccess.create({
      description: 'Test',
      active: true,
      system_id: system.id,
    });

    const response = await client.get(`/external/profiles`).bearerToken(token);

    assert.equal(response.status(), 200);
  });

  test('should async profile accesses', async ({ client, assert }) => {
    const { user, system, role } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
      systemName: system.name,
    });

    const pa = await ProfileAccess.create({
      description: 'Test',
      active: true,
      system_id: system.id,
    });

    const response = await client
      .post(`/external/sync`)
      .json({
        roleId: role.id,
        profileAccessIdList: [pa.id],
      })
      .bearerToken(token);

    assert.equal(response.status(), 204);
  });
});
