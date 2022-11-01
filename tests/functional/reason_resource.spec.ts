import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Reason from 'App/Models/Reason';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Reason resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group } = await userBootstrap();

    const reason = await Reason.create({
      reason: 'any reason',
      requiresObservation: true,
      type: 'RA',
      economicGroupId: group.id,
    });

    return { user, reason };
  };

  test('should list reasons', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/reasons').bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should throw NotFoundException if no reason is found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/reasons/${v4()}`).bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should return the reason', async ({ assert, client }) => {
    const { user, reason } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/reasons/${reason.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(reason.reason, response.body().reason);
  });

  test('should create a reason', async ({ assert, client }) => {
    const { user } = await userBootstrap();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/reasons')
      .json({
        reason: 'any reason',
        requiresObservation: true,
        type: 'RA',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update a reason', async ({ assert, client }) => {
    const { user, reason } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/reasons/${reason.id}`)
      .json({
        reason: 'any reason',
        requiresObservation: true,
        type: 'RA',
        active: true,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should delete a reason', async ({ assert, client }) => {
    const { user, reason } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/reasons/${reason.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
