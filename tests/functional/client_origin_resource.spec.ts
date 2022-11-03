import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ClientOrigin, { ClientOriginType } from 'App/Models/ClientOrigin';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Client origin resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const origin = await ClientOrigin.create({
      description: 'some description',
      type: ClientOriginType.C,
      economic_group_id: group.id,
    });

    return { user, business, origin };
  };

  test('should return all client origins', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/client-origins`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create client origin', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/client-origins`)
      .json({
        description: 'some description',
        type: ClientOriginType.C,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
    assert.exists(response.body().id);
  });

  test('should update client origin', async ({ assert, client }) => {
    const { user, origin } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/client-origins/${origin.id}`)
      .json({
        description: 'some description',
        type: ClientOriginType.C,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.exists(response.body().id);
  });

  test('should delete client origin', async ({ assert, client }) => {
    const { user, origin } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/client-origins/${origin.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should return NotFoundException if no client was found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/client-origins/${v4()}`)
      .bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should return client origin', async ({ assert, client }) => {
    const { user, origin } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/client-origins/${origin.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.exists(response.body().id);
  });
});
