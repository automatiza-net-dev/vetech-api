import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Attendance statuses resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business } = await userBootstrap();

    const status = await business.related('attendanceStatuses').create({
      description: 'some description',
      color: 'some color',
    });

    return { user, status };
  };

  test('should get all attendance statuses', async ({ assert, client }) => {
    const { user, status } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client.get('/attendance-statuses').bearerToken(token);

    const body = result.body();

    assert.equal(200, result.status());
    assert.isTrue(Boolean(body.find(f => f.id === status.id)));
  });

  test('should throw ResourceNotFoundException for invalid status', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .get(`/attendance-statuses/${v4()}`)
      .bearerToken(token);

    const body = result.body();

    assert.equal(404, result.status());
    assert.equal('E_NOT_FOUND: Recurso não encontrado', body.message);
  });

  test('should return valid status', async ({ assert, client }) => {
    const { user, status } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .get(`/attendance-statuses/${status.id}`)
      .bearerToken(token);

    const body = result.body();

    assert.equal(200, result.status());
    assert.equal(status.id, body.id);
  });

  test('should create a attendance status', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .post('/attendance-statuses')
      .json({
        description: 'some description',
        color: 'some color',
      })
      .bearerToken(token);

    assert.equal(201, result.status());
  });

  test('should update a attendance status', async ({ assert, client }) => {
    const { user, status } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .put(`/attendance-statuses/${status.id}`)
      .json({
        description: 'some new description',
        color: 'some color',
        active: true,
      })
      .bearerToken(token);

    const body = result.body();

    assert.equal(status.id, body.id);
    assert.notEqual(status.description, body.description);
  });

  test('should soft delete status', async ({ assert, client }) => {
    const { user, status } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .delete(`/attendance-statuses/${status.id}`)
      .bearerToken(token);

    assert.equal(204, result.status());
  });
});
