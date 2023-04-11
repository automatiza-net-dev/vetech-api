import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Plan from 'App/Models/Plan';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Plan resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, system } = await userBootstrap();

    const plan = await Plan.create({
      id: v4(),
      system_id: system.id,
      description: 'plan 1',
      trialDays: 10,
      trialAdditional: 5,
      default: true,
    });

    return { user, plan };
  };

  test('create plan', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/plans`)
      .json({
        description: 'plan 1',
        trialDays: 10,
        trialAdditional: 5,
        default: true,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('get all plans', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/plans').bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
  });

  test('get one plan', async ({ client, assert }) => {
    const { user, plan } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/plans/${plan.id}`).bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(plan.id, body.id);
  });

  test('throw exception for plan not found', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/plans/${v4()}`).bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Plano não encontrado', body.message as string);
  });

  test('update plan', async ({ client, assert }) => {
    const { user, plan } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/plans/${plan.id}`)
      .json({
        description: 'plan 2',
        trialDays: 15,
        trialAdditional: 2,
        default: false,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(plan.id, body.id);
    assert.notEqual(plan.description, body.description);
  });

  test('delete plan', async ({ client, assert }) => {
    const { user, plan } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/plans/${plan.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
