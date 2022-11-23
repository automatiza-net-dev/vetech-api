import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Budget, { BudgetStatus } from 'App/Models/Budget';
import DailyCashier from 'App/Models/DailyCashier';
import DailyMovement from 'App/Models/DailyMovement';
import PatientFactory from 'Database/factories/PatientFactory';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Budget resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business } = await userBootstrap();

    const client = await PatientFactory.create();
    const dailyMovement = await DailyMovement.create({
      business_unit_id: business.id,
    });
    const dailyCashier = await DailyCashier.create({
      business_unit_id: business.id,
    });

    const budget = await Budget.create({
      business_unit_id: business.id,
      status: BudgetStatus.A,
    });

    const budgetItem = await budget.related('items').create({
      business_unit_id: business.id,
      quantity: 12,
      unitaryValue: 10,
      discountValue: 2,
    });

    return { user, client, dailyMovement, dailyCashier, budget, budgetItem };
  };

  test('should return all budgets (partial)', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/budgets/partial`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should return all budgets (complete)', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/budgets/complete`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should return all products', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/budgets/products`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create budget', async ({ assert, client }) => {
    const {
      user,
      client: dbClient,
      dailyCashier,
      dailyMovement,
    } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/budgets/create`)
      .json({
        clientId: dbClient.id,
        dailyMovementId: dailyMovement.id,
        dailyCashierId: dailyCashier.id,
        budgetDate: new Date(),
        expirationDate: new Date(),
        productValue: 100,
        serviceValue: 200,
        discountValue: 55,
        observation: 'some',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should mark budget as deleted', async ({ assert, client }) => {
    const { user, budget } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/budgets/delete/${budget.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should create budget item', async ({ assert, client }) => {
    const { user, budget } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/budgets/create-item`)
      .json({
        budgetId: budget.id,
        productVariationId: '0a6ce842-5c86-4325-9ca3-68727efe908f', // should be a value created in the test
        quantity: 5,
        unitaryValue: 10,
        discountValue: 2,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update budget item', async ({ assert, client }) => {
    const { user, budgetItem } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/budgets/update-item/${budgetItem.id}`)
      .json({
        quantity: 200,
        unitaryValue: 200,
        discountValue: 200,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.notEqual(response.body().quantity, budgetItem.quantity);
    assert.notEqual(response.body().unitary_value, budgetItem.unitaryValue);
    assert.notEqual(response.body().discount_value, budgetItem.discountValue);
    assert.notEqual(response.body().total_value, budgetItem.totalValue);
  });

  test('should cancel budget', async ({ assert, client }) => {
    const { user, budget } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/budgets/cancel/${budget.id}`)
      .json({
        reasonId: 'e8a489fa-23ca-47f0-865d-5d7f463dd1c2',
        finishedAt: new Date(),
        canceledObservation: 'some observation',
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
