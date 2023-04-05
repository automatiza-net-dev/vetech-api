import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Group resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group } = await userBootstrap();

    const resGroup = await group.related('groups').create({
      name: 'group 1',
    });

    return { user, resGroup };
  };

  test('should return all groups', async ({ assert, client }) => {
    const { user, resGroup } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/groups').bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.isTrue(Boolean(body.find(b => b.id === resGroup.id)));
  });

  test('should create a new group', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/groups')
      .json({
        name: 'new group',
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(201, response.status());
    assert.equal('new group', body.name);
  });

  test('should throw ResourceNotFound for invalid group', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/groups/${v4()}`).bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Recurso não encontrado', body.message);
  });

  test('should return valid group', async ({ assert, client }) => {
    const { user, resGroup } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/groups/${resGroup.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(resGroup.id, body.id);
  });

  test('should update the group', async ({ assert, client }) => {
    const { user, resGroup } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/groups/${resGroup.id}`)
      .json({
        name: 'updated group',
        active: true,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(resGroup.id, body.id);
    assert.notEqual(resGroup.name, body.name);
  });

  test('should soft delete the group', async ({ assert, client }) => {
    const { user, resGroup } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/groups/${resGroup.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
