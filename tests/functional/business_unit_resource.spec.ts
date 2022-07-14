import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import User from 'App/Models/User';

import { userBootstrap } from '../utils';

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
    });

    const updatedBusinessUnit = response.body();

    assert.equal(unit.id, updatedBusinessUnit.id);
    assert.notEqual(unit.identification, updatedBusinessUnit.identification);
  });

  test('should return a list of users from the business unit', async ({
    client,
    assert,
  }) => {
    const [unit] = await createBusinessUnit();

    const response = await client.get(`/business-units/${unit.id}/users`);

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
      })
      .loginAs(user);

    assert.equal(201, response.status());
  });
});
