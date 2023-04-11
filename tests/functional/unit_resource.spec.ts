import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Unit, { UnitType } from 'App/Models/Unit';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Unit resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business, system } = await userBootstrap();

    const unit = await Unit.create({
      name: 'some unit',
      economic_group_id: group.id,
      tag: 'some tag',
      type: UnitType.PRODUCT,
      system_id: system.id,
    });

    return { user, unit, group, business };
  };

  test('should return all units', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/units`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create unit', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/units`)
      .json({
        name: 'some name',
        tag: 'some tag',
        type: UnitType.PRODUCT,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw NotFoundException if no unit was found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/units/${v4()}`).bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should throw NotFoundException if unit does not belong to user units', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const { unit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/units/${unit.id}`).bearerToken(token);

    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should return unit', async ({ assert, client }) => {
    const { user, unit } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/units/${unit.id}`).bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(unit.id, response.body().id);
  });

  test('should update unit', async ({ assert, client }) => {
    const { user, unit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/units/${unit.id}`)
      .json({
        name: 'some name',
        tag: 'some tag',
        type: UnitType.PRODUCT,
        active: true,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(unit.id, response.body().id);
  });

  test('should delete unit', async ({ assert, client }) => {
    const { user, unit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/units/${unit.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
