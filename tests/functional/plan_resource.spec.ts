import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Plan from 'App/Models/Plan';
import PlanFactory from 'Database/factories/PlanFactory';

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
});
