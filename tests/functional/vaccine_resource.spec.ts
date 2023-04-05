import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Subgroup from 'App/Models/Subgroup';
import Vaccine, { VaccineType } from 'App/Models/Vaccine';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Vaccine resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const subgroup = await Subgroup.create({
      description: 'some group',
      tree: [],
    });

    const vaccine = await Vaccine.create({
      name: 'some vaccine',
      description: 'some description',
      subgroup_id: subgroup.id,
      economic_group_id: group.id,
      type: VaccineType.VACCINE,
    });

    return { user, business, subgroup, vaccine };
  };

  test('should return all vaccines', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/vaccines`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create vaccine', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/vaccines`)
      .json({
        name: 'some name',
        description: 'some description',
        type: VaccineType.VACCINE,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw NotFoundException if no vaccine is found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/vaccines/${v4()}`).bearerToken(token);

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Vacina não encontrada', response.body().message);
  });

  test('should show vaccine', async ({ assert, client }) => {
    const { user, vaccine } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/vaccines/${vaccine.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(vaccine.id, response.body().id);
  });

  test('should update vaccine', async ({ assert, client }) => {
    const { user, vaccine } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/vaccines/${vaccine.id}`)
      .json({
        name: 'some name',
        description: 'some description',
        active: true,
        type: VaccineType.VACCINE,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(vaccine.id, response.body().id);
  });

  test('should soft delete vaccine', async ({ assert, client }) => {
    const { user, vaccine } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/vaccines/${vaccine.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
