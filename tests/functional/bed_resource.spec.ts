import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Bed, { BedType } from 'App/Models/Bed';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Bed resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business } = await userBootstrap();

    const bed = await Bed.create({
      name: 'some bed',
      tag: 'some tag',
      type: BedType.ICU,
      business_id: business.id,
    });

    return { user, bed };
  };

  test('should return all beds', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/beds`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create bed', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/beds`)
      .json({
        name: 'some name',
        tag: 'some description',
        type: BedType.ICU,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw NotFoundException if no bed is found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/beds/${v4()}`).bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should throw NotFoundException if bed does not belong to unit', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const { bed } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/beds/${bed.id}`).bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should return bed', async ({ assert, client }) => {
    const { user, bed } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/beds/${bed.id}`).bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(bed.id, response.body().id);
  });

  test('should update bed', async ({ assert, client }) => {
    const { user, bed } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/beds/${bed.id}`)
      .json({
        name: 'some name',
        tag: 'some description',
        type: BedType.ICU,
        active: true,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(bed.id, response.body().id);
  });

  test('should soft delete bed', async ({ assert, client }) => {
    const { user, bed } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.delete(`/beds/${bed.id}`).bearerToken(token);

    assert.equal(204, response.status());
  });
});
