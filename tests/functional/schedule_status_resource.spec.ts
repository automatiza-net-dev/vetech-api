import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Schedule status resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business, system } = await userBootstrap();

    const status = await group.related('scheduleStatuses').create({
      color: 'color1',
      description: 'description1',
      system_id: system.id,
    });

    return { user, business, status };
  };

  // test('should create new schedule status for super admin', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user, business } = await createData();
  //   await assignSuperAdmin(user, business);

  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const response = await client
  //     .post('/schedule-statuses')
  //     .json({
  //       description: 'some status',
  //       color: '#000',
  //     })
  //     .bearerToken(token);

  //   assert.equal(201, response.status());
  //   assert.isUndefined(response.body().economic_group_id);
  // });

  // test('should create new schedule status for normal user', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user } = await createData();

  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const response = await client
  //     .post('/schedule-statuses')
  //     .json({
  //       description: 'some status',
  //       color: '#000',
  //     })
  //     .bearerToken(token);

  //   assert.equal(201, response.status());
  //   assert.isDefined(response.body().economic_group_id);
  // });

  test('should return a list of schedule statuses', async ({
    assert,
    client,
  }) => {
    const { user, status } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/schedule-statuses').bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.isTrue(Boolean(body.find(b => b.id === status.id)));
  });

  // test('should throw ResourceNotFoundException if no status was found', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user } = await createData();

  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const response = await client
  //     .get(`/schedule-statuses/${v4()}`)
  //     .bearerToken(token);

  //   const body = response.body();

  //   assert.equal(404, response.status());
  //   assert.equal('E_NOT_FOUND: Recurso não foi encontrado', body.message);
  // });

  // test('should throw ResourceNotFoundException if status do not belong to user group', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user } = await createData();
  //   const { status } = await createData();

  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const response = await client
  //     .get(`/schedule-statuses/${status.id}`)
  //     .bearerToken(token);

  //   const body = response.body();

  //   assert.equal(404, response.status());
  //   assert.equal('E_NOT_FOUND: Recurso não foi encontrado', body.message);
  // });

  // test('should return status for super admin', async ({ assert, client }) => {
  //   const { user, business } = await createData();
  //   const { status } = await createData();

  //   await assignSuperAdmin(user, business);

  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const response = await client
  //     .get(`/schedule-statuses/${status.id}`)
  //     .bearerToken(token);

  //   const body = response.body();

  //   assert.equal(200, response.status());
  //   assert.equal(status.id, body.id);
  // });

  // test('should return status for same group user', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user, status } = await createData();

  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const response = await client
  //     .get(`/schedule-statuses/${status.id}`)
  //     .bearerToken(token);

  //   const body = response.body();

  //   assert.equal(200, response.status());
  //   assert.equal(status.id, body.id);
  // });

  // test('should update a schedule status', async ({ assert, client }) => {
  //   const { user, status } = await createData();

  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const response = await client
  //     .put(`/schedule-statuses/${status.id}`)
  //     .json({
  //       description: 'new description',
  //       color: '#000',
  //     })
  //     .bearerToken(token);

  //   const body = response.body();

  //   assert.equal(200, response.status());
  //   assert.notEqual(status.description, body.description);
  // });

  // test('should soft delete a status', async ({ assert, client }) => {
  //   const { user, status } = await createData();

  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const response = await client
  //     .delete(`/schedule-statuses/${status.id}`)
  //     .bearerToken(token);

  //   assert.equal(204, response.status());
  // });
});
