import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import WeekDay from 'App/Models/shared/WeekDay';
import User from 'App/Models/User';
import WorkingDay from 'App/Models/WorkingDay';
import UserFactory from 'Database/factories/UserFactory';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Working day resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<[User, WorkingDay]> => {
    const { user, business } = await userBootstrap();

    const working = await business.related('workingDays').create({
      id: v4(),
      user_id: user.id,
      weekDay: WeekDay.DOMINGO,
      startHour: '09:00',
      endHour: '18:00',
    });

    return [user, working];
  };

  test('should create new working day', async ({ client, assert }) => {
    const [user] = await createData();
    const newUser = await UserFactory.create();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/working-days')
      .json({
        userId: newUser.id,
        dayOfWeek: 'segunda',
        startHour: '09:00',
        endHour: '09:00',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should return list of working days', async ({ client, assert }) => {
    const [user, workingDay] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/working-days').bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.equal(workingDay.id, body[0].id);
  });

  test('should throw ResourceNotFoundException if no working day is found', async ({
    client,
    assert,
  }) => {
    const [_, workingDay] = await createData();
    const [user2] = await createData();
    const token = await generateJwtToken(client, {
      email: user2.email,
      password: '102030',
    });

    const response = await client
      .get(`/working-days/${workingDay.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Jornada não foi encontrada', body.message);
  });

  test('should return working day', async ({ client, assert }) => {
    const [user, workingDay] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/working-days/${workingDay.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(workingDay.id, body.id);
  });

  test('should update a working day', async ({ client, assert }) => {
    const [user, workingDay] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/working-days/${workingDay.id}`)
      .json({
        dayOfWeek: 'terca',
        startHour: '09:00',
        endHour: '09:00',
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(workingDay.id, body.id);
    assert.notEqual(workingDay.weekDay, body.dayOfWeek);
  });

  test('should delete a working day', async ({ client, assert }) => {
    const [user, workingDay] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/working-days/${workingDay.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
