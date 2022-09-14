import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ClinicParameter from 'App/Models/ClinicParameter';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Clinic parameter resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user } = await userBootstrap();

    const parameter = await ClinicParameter.create({
      name: 'some bed',
      tag: 'some tag',
    });

    return { user, parameter };
  };

  test('should return all clinic parameters', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/clinic-parameters`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create clinic parameters', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/clinic-parameters`)
      .json({
        name: 'some name',
        tag: 'some description',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw NotFoundException if no clinic parameter is found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/clinic-parameters/${v4()}`)
      .bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should update clinic parameter', async ({ assert, client }) => {
    const { user, parameter } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/clinic-parameters/${parameter.id}`)
      .json({
        name: 'some name',
        tag: 'some description',
        active: true,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(parameter.id, response.body().id);
  });

  test('should soft delete clinic parameter', async ({ assert, client }) => {
    const { user, parameter } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/clinic-parameters/${parameter.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
