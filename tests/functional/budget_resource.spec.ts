import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Budget, { BudgetStatus } from 'App/Models/Budget';
import DailyCashier from 'App/Models/DailyCashier';
import DailyMovement from 'App/Models/DailyMovement';
import Reason from 'App/Models/Reason';
import PatientFactory from 'Database/factories/PatientFactory';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Budget resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const client = await PatientFactory.create();
    const patient = await PatientFactory.create();
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

    const reason = await Reason.create({
      economicGroupId: group.id,
      type: 'OR',
      reason: 'Test',
    });

    return {
      user,
      client,
      patient,
      dailyMovement,
      dailyCashier,
      budget,
      budgetItem,
      reason,
    };
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

  test('should throw ResourceNoFoundException if no budget was found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/budgets/${v4()}`).bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should return complete budget', async ({ assert, client }) => {
    const { user, budget } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/budgets/${budget.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(budget.id, response.body().id);
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
      patient,
    } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/budgets/create`)
      .json({
        clientId: dbClient.id,
        patientId: patient.id,
        dailyMovementId: dailyMovement.id,
        dailyCashierId: dailyCashier.id,
        budgetDate: new Date(),
        expirationDate: new Date(),
        observation: 'some',
        items: [],
      })
      .bearerToken(token);

    assert.equal(201, response.status());
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
        productVariationId: '55c09fc1-251f-4fcc-84c3-7207d33eab4c', // should be a value created in the test
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
        status: BudgetStatus.C,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.notEqual(response.body().quantity, budgetItem.quantity);
    assert.notEqual(response.body().unitary_value, budgetItem.unitaryValue);
    assert.notEqual(response.body().discount_value, budgetItem.discountValue);
    assert.notEqual(response.body().total_value, budgetItem.totalValue);
  });

  test('should confirm budget (TOTAL)', async ({ assert, client }) => {
    const { user, budget } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/budgets/confirm/${budget.id}`)
      .json({
        type: 'TOTAL',
        notConfirmedItems: [],
        finishedAt: new Date(),
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should confirm budget (PARCIAL)', async ({ assert, client }) => {
    const { user, budget, reason } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/budgets/confirm/${budget.id}`)
      .json({
        type: 'PARCIAL',
        notConfirmedItems: [],
        finishedAt: new Date(),
        reasonId: reason.id,
        canceledObservation: 'Test',
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should cancel budget', async ({ assert, client }) => {
    const { user, budget, reason } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/budgets/cancel/${budget.id}`)
      .json({
        reasonId: reason.id,
        finishedAt: new Date(),
        canceledObservation: 'some observation',
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
