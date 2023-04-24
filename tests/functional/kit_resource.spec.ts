import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Kit from 'App/Models/Kit';
import { DateTime } from 'luxon';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('kit resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business } = await userBootstrap();

    const kit = await Kit.create({
      description: 'some description',
      fromExpiration: DateTime.now(),
      toExpiration: DateTime.now(),
      business_unit_id: business.id,
      economic_group_id: business.economicGroupId,
    });

    return { user, kit };
  };

  test('should return all kits', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/kits`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create kit', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/kits`)
      .json({
        description: 'some description',
        fromExpiration: new Date(),
        toExpiration: new Date(),
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw NotFoundException if no kit is found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/kits/${-1}`).bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should throw NotFoundException if kit does not belong to unit', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const { kit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/kits/${kit.id}`).bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should return kit', async ({ assert, client }) => {
    const { user, kit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/kits/${kit.id}`).bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(kit.id, response.body().id);
  });

  test('should update kit', async ({ assert, client }) => {
    const { user, kit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/kits/${kit.id}`)
      .json({
        description: 'some description',
        fromExpiration: new Date(),
        toExpiration: new Date(),
        active: true,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(kit.id, response.body().id);
  });

  test('should soft delete kit', async ({ assert, client }) => {
    const { user, kit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.delete(`/kits/${kit.id}`).bearerToken(token);

    assert.equal(204, response.status());
  });
});
