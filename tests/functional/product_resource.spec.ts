import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Product, { ProductType } from 'App/Models/Product';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Product resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business } = await userBootstrap();

    const variationGroup = await group.related('variationGroups').create({
      description: 'some description',
    });

    const product = await Product.create({
      description: 'some product',
      type: ProductType.PRODUCT,
      referenceCode: 'some reference code',
      collectionYear: 2022,
      ncm: 'some ncm',
      cest: 'some cest',
      features: 'some features',
      unityType: 'some unity type',
      active: true,
      economic_group_id: group.id,
      variation_group_id: variationGroup.id,
    });

    return { user, product, variationGroup, business };
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
    const { user, variationGroup } = await createData();
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
        group: variationGroup.id,
        variations: [
          {
            barcode: 'some bar code',
            variation_options: [],
            price: {
              price: 10,
              costPrice: 10,
              maximumStock: 10,
              minimumStock: 10,
              maximumDiscountPercentage: 10,
              maximumDiscountValue: 10,
              profitMargin: 10,
            },
          },
        ],
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create a product with specific business price', async ({
    client,
    assert,
  }) => {
    const { user, variationGroup, business } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const randomValue = Math.random() * 100_000;

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
        group: variationGroup.id,
        variations: [
          {
            barcode: 'some bar code',
            variation_options: [],
            price: {
              price: 10,
              costPrice: 10,
              maximumStock: 10,
              minimumStock: 10,
              maximumDiscountPercentage: 10,
              maximumDiscountValue: 10,
              profitMargin: 10,
            },
            specificPrice: [
              {
                business: business.id,
                price: {
                  price: randomValue,
                  costPrice: randomValue,
                  maximumStock: randomValue,
                  minimumStock: randomValue,
                  maximumDiscountPercentage: randomValue,
                  maximumDiscountValue: randomValue,
                  profitMargin: randomValue,
                },
              },
            ],
          },
        ],
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
