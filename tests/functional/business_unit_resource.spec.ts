import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import TefAcquirer from 'App/Models/TefAcquirer';
import User from 'App/Models/User';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Business unit resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createBusinessUnit = async (): Promise<
    [BusinessUnit, EconomicGroup, User]
  > => {
    const { user, group, business } = await userBootstrap();

    return [business, group, user];
  };

  test('should return a list of all business units', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/business-units');

    const businessUnits = response.body();

    assert.isArray(businessUnits);
  });

  test('update business unit', async ({ client, assert }) => {
    const [unit] = await createBusinessUnit();
    const response = await client.put(`/business-units/${unit.id}`).json({
      identification: 'TESTING',
      simple: true,
    });

    const updatedBusinessUnit = response.body();

    assert.equal(unit.id, updatedBusinessUnit.id);
    assert.notEqual(unit.identification, updatedBusinessUnit.identification);
  });

  test('should return a list of users from the business unit', async ({
    client,
    assert,
  }) => {
    const [_, __, user] = await createBusinessUnit();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/business-units/users`)
      .bearerToken(token);

    const userList = response.body();

    assert.isArray(userList);
  });

  test('should return a list of business units from logged user', async ({
    client,
    assert,
  }) => {
    const [unit, _, user] = await createBusinessUnit();

    const response = await client.get(`/business-units/user`).loginAs(user);

    const units = response.body();

    assert.isArray(units);
    assert.equal(unit.id, units[0].id);
  });

  test('should create new business unit', async ({ client, assert }) => {
    const [_, economicGroup, user] = await createBusinessUnit();

    const response = await client
      .post(`/business-units/`)
      .json({
        economic_group_id: economicGroup.id,
        document: '123',
        email: 'mail@mail.com',
        stateRegistration: 'some',
        cityRegistration: 'some',
        cnae: 'some',
        simple: true,
      })
      .loginAs(user);

    assert.equal(201, response.status());
  });

  test('should throw NotFoundException if no acquirer was found', async ({
    client,
    assert,
  }) => {
    const [_, __, user] = await createBusinessUnit();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/business-units/update-acquirer/${v4()}`)
      .json({
        document: 'some',
        active: true,
      })
      .bearerToken(token);

    assert.equal(404, response.status());
  });

  test('update business unit acquirer', async ({ client, assert }) => {
    const [unit, group, user] = await createBusinessUnit();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const tefAcq = await TefAcquirer.create({
      economic_group_id: group.id,
      description: 'any description',
    });

    const acq = await unit.related('acquirers').create({
      tef_acquirer_id: tefAcq.id,
      document: '',
      active: true,
    });

    const response = await client
      .put(`/business-units/update-acquirer/${acq.id}`)
      .json({
        document: 'some',
        active: true,
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should throw NotFoundException if no acquirer was found when deleting', async ({
    client,
    assert,
  }) => {
    const [_, __, user] = await createBusinessUnit();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/business-units/delete-acquirer/${v4()}`)
      .bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should delete business unit acquirer', async ({ client, assert }) => {
    const [unit, group, user] = await createBusinessUnit();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const tefAcq = await TefAcquirer.create({
      economic_group_id: group.id,
      description: 'any description',
    });

    const acq = await unit.related('acquirers').create({
      tef_acquirer_id: tefAcq.id,
      document: '',
      active: true,
    });

    const response = await client
      .delete(`/business-units/delete-acquirer/${acq.id}`)

      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
