import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Plan from 'App/Models/Plan';
import PlanPrice, { PlanPriceRecurrence } from 'App/Models/PlanPrice';
import PlanFactory from 'Database/factories/PlanFactory';
import { v4 } from 'uuid';

test.group('Plan price resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createPlan = async (): Promise<[Plan, PlanPrice]> => {
    const model = await PlanFactory.create();
    const model2 = await model.related('planPrices').create({
      id: v4(),
      plan_id: model.id,
      planPrice: 100,
      recurrence: PlanPriceRecurrence.CUSTOM,
      expirationDays: 30,
    });

    return [model, model2];
  };

  test('create price plan', async ({ client, assert }) => {
    const [plan] = await createPlan();
    const response = await client.post(`/plan-prices`).json({
      plan_id: plan.id,
      planPrice: 100,
      recurrence: PlanPriceRecurrence.CUSTOM,
      expirationDays: 30,
    });

    assert.equal(201, response.status());
  });

  test('get all price plans', async ({ client, assert }) => {
    const [_, pricePlan] = await createPlan();

    const response = await client.get('/plan-prices');

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.isTrue(Boolean(body.find(f => f.id === pricePlan.id)));
  });

  test('get one price plan', async ({ client, assert }) => {
    const [_, pricePlan] = await createPlan();

    const response = await client.get(`/plan-prices/${pricePlan.id}`);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(pricePlan.id, body.id);
  });

  test('update price plan', async ({ client, assert }) => {
    const [plan, pricePlan] = await createPlan();

    const response = await client.put(`/plan-prices/${pricePlan.id}`).json({
      plan_id: plan.id,
      planPrice: 200,
      recurrence: PlanPriceRecurrence.CUSTOM,
      expirationDays: 30,
    });

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(200, body.plan_price);
  });

  test('soft delete price plan', async ({ client, assert }) => {
    const [_, pricePlan] = await createPlan();

    const response = await client.delete(`/plan-prices/${pricePlan.id}`);

    assert.equal(204, response.status());
  });
});
