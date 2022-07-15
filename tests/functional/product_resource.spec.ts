import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { ProductType } from 'App/Models/Product';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Product resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group } = await userBootstrap();

    const product = await group.related('products').create({
      description: 'some product',
      type: ProductType.PRODUCT,
      referenceCode: 'some reference code',
      collectionYear: 2022,
      ncm: 'some ncm',
      cest: 'some cest',
      features: 'some features',
      unityType: 'some unity type',
      active: true,
    });

    return { user, product };
  };

  test('should return a list of products', async ({ client, assert }) => {
    const { user, product } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/products').bearerToken(token);

    const body = response.body();

    assert.isArray(body);
    assert.isTrue(Boolean(body.find(f => f.id === product.id)));
  });

  test('should create a product', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/products')
      .json({
        description: 'product 1',
        type: ProductType.PRODUCT,
        referenceCode: '00001',
        collectionYear: 2022,
        ncm: 'some ncm',
        cest: 'some cest',
        features: 'some features',
        unityType: 'some unity type',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw ResourceNotFound if no product is found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/products/${v4()}`).bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should return given product', async ({ client, assert }) => {
    const { user, product } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/products/${product.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(product.id, response.body().id);
  });

  test('should update a product', async ({ client, assert }) => {
    const { user, product } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/products/${product.id}`)
      .json({
        description: 'updated product',
        type: ProductType.PRODUCT,
        referenceCode: '00001',
        collectionYear: 2022,
        ncm: 'some ncm',
        cest: 'some cest',
        features: 'some features',
        unityType: 'some unity type',
        active: true,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(product.id, body.id);
    assert.notEqual(product.description, body.description);
  });

  test('should soft delete a product', async ({ client, assert }) => {
    const { user, product } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/products/${product.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
