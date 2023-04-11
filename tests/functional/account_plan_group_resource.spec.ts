import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import AccountPlanGroup, {
  AccountPlanGroupType,
} from 'App/Models/AccountPlanGroup';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Account plan group resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, system } = await userBootstrap();

    const apg = await AccountPlanGroup.create({
      economic_group_id: group.id,
      description: 'some description',
      type: AccountPlanGroupType.A,
      system_id: system.id,
    });

    return { user, apg };
  };

  test('should get all account plan groups', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client.get('/account-plan-groups').bearerToken(token);

    assert.equal(200, result.status());
    assert.isArray(result.body());
  });

  test('should create account plan group', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .post('/account-plan-groups')
      .json({
        description: 'some description',
        type: AccountPlanGroupType.A,
      })
      .bearerToken(token);

    assert.equal(201, result.status());
  });

  test('should throw ResourceNotFoundException for account plan group', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .get(`/account-plan-groups/-1`)
      .bearerToken(token);

    assert.equal(404, result.status());
  });

  test('should return account plan group', async ({ assert, client }) => {
    const { user, apg } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .get(`/account-plan-groups/${apg.id}`)
      .bearerToken(token);

    assert.equal(200, result.status());
  });

  test('should throw ResourceNotFoundException for invalid account plan group when updating', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .put(`/account-plan-groups/-1`)
      .json({
        description: 'some description',
        type: AccountPlanGroupType.A,
        active: false,
      })
      .bearerToken(token);

    assert.equal(404, result.status());
  });

  test('should update account plan group', async ({ assert, client }) => {
    const { user, apg } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .put(`/account-plan-groups/${apg.id}`)
      .json({
        description: 'some description',
        type: AccountPlanGroupType.A,
        active: false,
      })
      .bearerToken(token);

    assert.equal(200, result.status());
  });

  test('should throw ResourceNotFoundException for invalid account plan group when deleting', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .delete(`/account-plan-groups/-1`)
      .bearerToken(token);

    assert.equal(404, result.status());
  });

  test('should delete account plan group', async ({ assert, client }) => {
    const { user, apg } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .delete(`/account-plan-groups/${apg.id}`)
      .bearerToken(token);

    assert.equal(204, result.status());
  });
});
