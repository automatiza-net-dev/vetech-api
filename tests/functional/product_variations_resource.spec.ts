import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { ProductType } from 'App/Models/Product';
import Unit, { UnitType } from 'App/Models/Unit';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Product variations resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group } = await userBootstrap();

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
    });

    const variation = await product.related('variations').create({
      barcode: '123',
    });

    return { user, product, variation };
  };

  test('should return a list of product variations', async ({
    client,
    assert,
  }) => {
    const { user, variation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/product-variations').bearerToken(token);

    const body = response.body();

    assert.isArray(body);
    assert.isTrue(Boolean(body.find(f => f.id === variation.id)));
  });

  test('should create a product variation', async ({ client, assert }) => {
    const { user, product } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/product-variations')
      .json({
        productId: product.id,
        barcode: '123',
        options: [],
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw ResourceNotFound if no product variation is found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/product-variations/${v4()}`)
      .bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should return given product variation', async ({ client, assert }) => {
    const { user, variation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/product-variations/${variation.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(variation.id, response.body().id);
  });

  test('should update a product variation', async ({ client, assert }) => {
    const { user, product, variation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/product-variations/${variation.id}`)
      .json({
        productId: product.id,
        barcode: '321',
        active: true,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(variation.id, body.id);
    assert.notEqual(variation.barcode, body.barcode);
  });

  test('should soft delete a product variation', async ({ client, assert }) => {
    const { user, variation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/product-variations/${variation.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
