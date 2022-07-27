import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import WeekDay from 'App/Models/shared/WeekDay';
import UnavailableDay from 'App/Models/UnavailableDay';
import User from 'App/Models/User';
import UserFactory from 'Database/factories/UserFactory';
import { DateTime } from 'luxon';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Unavailable day resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<[User, UnavailableDay]> => {
    const { user, business } = await userBootstrap();

    const model = await business.related('unavailableDays').create({
      user_id: user.id,
      startDate: DateTime.now(),
      endDate: DateTime.now(),
      startHour: '09:00',
      endHour: '21:00',
      frequency: WeekDay.SEGUNDA,
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
        startDate: DateTime.now(),
        endDate: DateTime.now(),
        startHour: '09:00',
        endHour: '21:00',
        frequency: WeekDay.SEGUNDA,
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
        startDate: DateTime.now(),
        endDate: DateTime.now(),
        startHour: '10:00',
        endHour: '21:00',
        frequency: WeekDay.SEGUNDA,
        active: true,
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
