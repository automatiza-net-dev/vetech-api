import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Plan from 'App/Models/Plan';
import PlanFactory from 'Database/factories/PlanFactory';
import { v4 } from 'uuid';

test.group('Plan resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createPlan = async (): Promise<[Plan]> => {
    const model = await PlanFactory.create();

    return [model];
  };

  test('create plan', async ({ client, assert }) => {
    const response = await client.post(`/plans`).json({
      description: 'plan 1',
      trialDays: 10,
      trialAdditional: 5,
      default: true,
    });

    assert.equal(201, response.status());
  });

  test('get all plans', async ({ client, assert }) => {
    const [plan] = await createPlan();

    const response = await client.get('/plans');

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.equal(plan.id, body[0].id);
  });

  test('get one plan', async ({ client, assert }) => {
    const [plan] = await createPlan();

    const response = await client.get(`/plans/${plan.id}`);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(plan.id, body.id);
  });

  test('throw exception for plan not found', async ({ client, assert }) => {
    const response = await client.get(`/plans/${v4()}`);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Plano não encontrado', body.message as string);
  });

  test('update plan', async ({ client, assert }) => {
    const [plan] = await createPlan();

    const response = await client.put(`/plans/${plan.id}`).json({
      description: 'plan 2',
      trialDays: 15,
      trialAdditional: 2,
      default: false,
    });

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(plan.id, body.id);
    assert.notEqual(plan.description, body.description);
  });
});
