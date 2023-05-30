import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Activity from 'App/Models/Activity';

import { userBootstrap, generateJwtToken } from '../utils';

test.group('Activity resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const activity = await Activity.create({
      description: 'Agendado (Confirmado)',
      type: 'crm',
      duration: 10,
    });

    return { user, business, group, activity };
  };

  test('should get all activities', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client.get(`/activities`).bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should create activity', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .post(`/activities`)
      .json({
        description: 'some description',
        type: 'crm',
        duration: 10,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw BadRequestException if no activity was found', async ({
    assert,
    client,
  }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client.get(`/activities/0`).bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should get activity', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .get(`/activities/${props.activity.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should update activity', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .put(`/activities/${props.activity.id}`)
      .json({
        description: 'some description',
        type: 'crm',
        duration: 10,
        active: true,
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should delete activity', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/activities/${props.activity.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
