import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import User from 'App/Models/User';
import UserFactory from 'Database/factories/UserFactory';
import { v4 } from 'uuid';

test.group('Business unit resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createBusinessUnit = async (): Promise<
    [BusinessUnit, EconomicGroup, User]
  > => {
    const user = await UserFactory.create();

    const newGroup = await user.related('economicGroups').create({
      id: v4(),
      document: user.document,
      responsibleEmail: user.email,
      responsiblePhone: user.phone,
    });
    await newGroup.save();

    const newBusinessUnit = await newGroup.related('businessUnits').create({
      id: v4(),
      document: user.document,
      phone: user.phone,
      email: user.email,
      origin: 'TESTING',
    });
    await newBusinessUnit.save();

    return [newBusinessUnit, newGroup, user];
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
});
