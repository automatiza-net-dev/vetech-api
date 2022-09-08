import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Subgroup from 'App/Models/Subgroup';
import Vaccine, { VaccineType } from 'App/Models/Vaccine';
import VaccineProtocol from 'App/Models/VaccineProtocol';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Vaccine protocol resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business } = await userBootstrap();

    const subgroup = await Subgroup.create({
      description: 'some group',
      tree: [],
    });

    const vaccine = await Vaccine.create({
      name: 'some vaccine',
      description: 'some description',
      subgroup_id: subgroup.id,
      business_unit_id: business.id,
      type: VaccineType.VACCINE,
    });

    const protocol = await VaccineProtocol.create({
      name: 'some protocol',
      doses: 1,
      interval: 1,
      active: true,
      vaccine_id: vaccine.id,
    });

    return { user, business, subgroup, vaccine, protocol };
  };

  test('should return all vaccine protocols', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/vaccine-protocols`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create vaccine protocol', async ({ assert, client }) => {
    const { user, vaccine } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/vaccine-protocols`)
      .json({
        name: 'some protocol',
        vaccineId: vaccine.id,
        doses: 5,
        interval: 3,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update vaccine protocol', async ({ assert, client }) => {
    const { user, vaccine, protocol } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/vaccine-protocols/${protocol.id}`)
      .json({
        name: 'some protocol',
        vaccineId: vaccine.id,
        doses: 5,
        interval: 3,
        active: true,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
  });
});
