import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Budget, { BudgetStatus } from 'App/Models/Budget';
import { BusinessUnitProductMetaType } from 'App/Models/BusinessUnitProduct';
import DailyCashier from 'App/Models/DailyCashier';
import DailyMovement from 'App/Models/DailyMovement';
import Kit from 'App/Models/Kit';
import { ProductType } from 'App/Models/Product';
import ProductVariation from 'App/Models/ProductVariation';
import Reason from 'App/Models/Reason';
import Unit, { UnitType } from 'App/Models/Unit';
import PatientFactory from 'Database/factories/PatientFactory';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
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

    const unit = await Unit.create({
      name: 'some name',
      tag: 'some tag',
      type: UnitType.PRODUCT,
    });

    const product = await group.related('products').create({
      description: 'some product',
      type: ProductType.PRODUCT,
      referenceCode: 'some reference code',
      collectionYear: 2022,
      ncm: 'some ncm',
      cest: 'some cest',
      features: 'some features',
      unit_id: unit.id,
      active: true,
      icmsOrigin: '0',
    });

    const variation = await ProductVariation.create({
      barcode: '123',
      product_id: product.id,
    });
    await variation.related('variationOptions').create({
      description: 'some variation option',
      active: true,
    });

    const budget = await Budget.create({
      business_unit_id: business.id,
      status: BudgetStatus.A,
      client_id: client.id,
    });

    const budgetItem = await budget.related('items').create({
      business_unit_id: business.id,
      quantity: 12,
      unitaryValue: 10,
      discountValue: 2,
      product_variation_id: variation.id,
    });

    const reason = await Reason.create({
      economicGroupId: group.id,
      type: 'OR',
      reason: 'Test',
    });

    const kit = await Kit.create({
      description: 'some description',
      fromExpiration: DateTime.now(),
      toExpiration: DateTime.now(),
      economic_group_id: business.economicGroupId,
    });

    await variation.related('businessUnitProducts').create({
      businness_unit_id: business.id,
      price: 10,
      stock: 10,
      maximumStock: 10,
      minimumStock: 10,
      maximumDiscountPercentage: 10,
      commission: 10,
      commissionMeta: 10,
      costPrice: 10,
      maximumDiscountValue: 10,
      meta: 10,
      metaType: BusinessUnitProductMetaType.Quantidade,
      profitMargin: 10,
    });

    const kitItem = await kit.related('items').create({
      product_variation_id: variation.id,
      quantity: 10,
      discountPrice: 10,
      discountPercentage: 10,
      salePrice: 10,
      originalPrice: 10,
      business_unit_id: business.id,
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
      variation,
      kit,
      kitItem,
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
        sellerId: user.id,
        reviewerId: user.id,
        clientId: dbClient.id,
        patientId: patient.id,
        dailyMovementId: dailyMovement.id,
        dailyCashierId: dailyCashier.id,
        evaluationId: new mongoose.Types.ObjectId(),

        budgetDate: new Date(),
        expirationDate: new Date(),
        observation: 'some',
        items: [],
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create budget without cashier related', async ({
    assert,
    client,
  }) => {
    const { user, client: dbClient, patient } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/budgets/create`)
      .json({
        sellerId: user.id,
        reviewerId: user.id,
        clientId: dbClient.id,
        patientId: patient.id,
        budgetDate: new Date(),
        expirationDate: new Date(),
        observation: 'some',
        items: [],
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create budget item', async ({ assert, client }) => {
    const { user, budget, variation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/budgets/create-item`)
      .json({
        budgetId: budget.id,
        productVariationId: variation.id,
        quantity: 5,
        unitaryValue: 10,
        discountValue: 2,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw BadRequestException if discount item if bigger than max discount', async ({
    assert,
    client,
  }) => {
    const { user, budget, variation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/budgets/create-item`)
      .json({
        budgetId: budget.id,
        productVariationId: variation.id,
        quantity: 5,
        unitaryValue: 10,
        discountValue: 10000,
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should create budget items', async ({ assert, client }) => {
    const { user, budget, variation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/budgets/create-items`)
      .json({
        items: [
          {
            budgetId: budget.id,
            productVariationId: variation.id,
            quantity: 5,
            unitaryValue: 10,
            discountValue: 2,
          },
        ],
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw BadRequestException if some discount item if bigger than max discount', async ({
    assert,
    client,
  }) => {
    const { user, budget, variation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/budgets/create-items`)
      .json({
        items: [
          {
            budgetId: budget.id,
            productVariationId: variation.id,
            quantity: 5,
            unitaryValue: 10,
            discountValue: 10000,
          },
        ],
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should update budget', async ({ assert, client }) => {
    const { user, budget } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/budgets/update/${budget.id}`)
      .json({
        sellerId: user.id,
        clientId: budget.client_id,
        patientId: budget.patient_id,
        reviewerId: user.id,
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should update budget observation', async ({ assert, client }) => {
    const { user, budget } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/budgets/update-observation/${budget.id}`)
      .json({
        observation: 'some observation',
      })
      .bearerToken(token);

    assert.equal(204, response.status());
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
        discountValue: 0,
        status: BudgetStatus.C,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
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

    assert.equal(200, response.status());
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

    assert.equal(200, response.status());
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

  test('should add kit do budget', async ({ assert, client }) => {
    const { user, budget, kit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/budgets/add-kit`)
      .json({
        budgetId: budget.id,
        kitId: kit.id,
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should throw BadRequestException if budget is not active', async ({
    assert,
    client,
  }) => {
    const { user, budget, kit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await budget
      .merge({
        status: BudgetStatus.C,
      })
      .save();

    const response = await client
      .post(`/budgets/add-kit`)
      .json({
        budgetId: budget.id,
        kitId: kit.id,
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should throw BadRequestException if kit is not active', async ({
    assert,
    client,
  }) => {
    const { user, budget, kit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await kit
      .merge({
        active: false,
      })
      .save();

    const response = await client
      .post(`/budgets/add-kit`)
      .json({
        budgetId: budget.id,
        kitId: kit.id,
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should throw BadRequestException if budget has invalid status when deleting', async ({
    assert,
    client,
  }) => {
    const { user, budget } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await budget
      .merge({
        status: BudgetStatus.C,
      })
      .save();

    const response = await client
      .delete(`/budgets/delete/${budget.id}`)
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should soft delete budget', async ({ assert, client }) => {
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
});
