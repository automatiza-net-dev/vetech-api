import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { LicenceType } from 'App/Models/Licence';
import UnavailableDay from 'App/Models/UnavailableDay';
import User from 'App/Models/User';
import RoleFactory from 'Database/factories/RoleFactory';
import UserFactory from 'Database/factories/UserFactory';
import { addDays } from 'date-fns';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { generateJwtToken } from '../utils';

test.group('Unavailable day resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<[User, UnavailableDay]> => {
    const user = await UserFactory.create();

    const newGroup = await user.related('economicGroups').create({
      id: v4(),
      document: user.document,
      responsibleEmail: user.email,
      responsiblePhone: user.phone,
    });

    const newBusinessUnit = await newGroup.related('businessUnits').create({
      id: v4(),
      document: user.document,
      phone: user.phone,
      email: user.email,
      origin: 'TESTING',
    });

    const role = await RoleFactory.create();

    await user.related('roles').create({
      role_id: role.id,
      unit_id: newBusinessUnit.id,
    });

    await newBusinessUnit.related('licences').create({
      id: v4(),
      active: true,
      expirationDate: addDays(new Date(), 1),
      type: LicenceType.TRIAL,
    });

    const model = await newBusinessUnit.related('unavailableDays').create({
      id: v4(),
      user_id: user.id,
      startHour: DateTime.now(),
      endHour: DateTime.now(),
    });

    return [user, model];
  };

  test('should create new unavailable day', async ({ client, assert }) => {
    const [user] = await createData();
    const newUser = await UserFactory.create();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/unavailable-days')
      .json({
        userId: newUser.id,
        startHour: new Date().toISOString(),
        endHour: new Date().toISOString(),
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should return list of unavailable days', async ({ client, assert }) => {
    const [user, unavailableDay] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/unavailable-days').bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.equal(unavailableDay.id, body[0].id);
  });

  test('should throw ResourceNotFoundException if no unavaiable day is found', async ({
    client,
    assert,
  }) => {
    const [_, unavailableDay] = await createData();
    const [user2] = await createData();
    const token = await generateJwtToken(client, {
      email: user2.email,
      password: '102030',
    });

    const response = await client
      .get(`/unavailable-days/${unavailableDay.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Recurso não foi encontrada', body.message);
  });

  test('should return unavailable day', async ({ client, assert }) => {
    const [user, unavailableDay] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/unavailable-days/${unavailableDay.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(unavailableDay.id, body.id);
  });

  test('should update a unavailable day', async ({ client, assert }) => {
    const [user, unavailableDay] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/unavailable-days/${unavailableDay.id}`)
      .json({
        startHour: new Date().toISOString(),
        endHour: new Date().toISOString(),
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(unavailableDay.id, body.id);
  });

  test('should delete a unavailable day', async ({ client, assert }) => {
    const [user, unavailableDay] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/unavailable-days/${unavailableDay.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
