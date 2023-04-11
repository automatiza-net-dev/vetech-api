import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import DrugAdministration from 'App/Models/DrugAdministration';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Drug administration resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group, system } = await userBootstrap();

    const drug = await DrugAdministration.create({
      description: 'some description',
      economic_group_id: group.id,
      system_id: system.id,
    });

    return { user, drug, business };
  };

  test('should return all drug administrations', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/drug-administrations`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create drug administration', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/drug-administrations`)
      .json({
        description: 'some description',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw NotFoundException if no drug administration was found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/drug-administrations/${v4()}`)
      .bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should throw NotFoundException if drug administration does not belong to group', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const { drug } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/drug-administrations/${drug.id}`)
      .bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should return drug administration', async ({ assert, client }) => {
    const { user, drug } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/drug-administrations/${drug.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(drug.id, response.body().id);
  });

  test('should update drug administration', async ({ assert, client }) => {
    const { user, drug } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/drug-administrations/${drug.id}`)
      .json({
        description: 'some description',
        active: true,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(drug.id, response.body().id);
  });

  test('should delete drug administration', async ({ assert, client }) => {
    const { user, drug } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/drug-administrations/${drug.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
