import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import TaxationGroup from 'App/Models/TaxationGroup';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Taxation group resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group } = await userBootstrap();

    const taxation = await TaxationGroup.create({
      name: 'any name',
      economic_group_id: group.id,
    });

    return { user, taxation };
  };

  test('should create new taxation group', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/taxation-groups')
      .json({
        name: 'any name',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should return list of taxation groups', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/taxation-groups').bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should throw NotFoundException if no group is found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/taxation-groups/${v4()}`)
      .bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should return taxation group by id', async ({ client, assert }) => {
    const { user, taxation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/taxation-groups/${taxation.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should update taxation group', async ({ client, assert }) => {
    const { user, taxation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/taxation-groups/${taxation.id}`)
      .json({
        name: 'new name',
        active: true,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.notEqual(taxation.name, response.body().name);
  });

  test('should delete taxation group', async ({ client, assert }) => {
    const { user, taxation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/taxation-groups/${taxation.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
