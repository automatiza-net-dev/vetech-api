import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Product, { ProductType } from 'App/Models/Product';
import ProductivityItem from 'App/Models/ProductivityItem';
import ProductVariation from 'App/Models/ProductVariation';
import Unit, { UnitType } from 'App/Models/Unit';
import { v4 } from 'uuid';

import { userBootstrap, generateJwtToken } from '../utils';

test.group('Productivity item resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group } = await userBootstrap();

    const variationGroup = await group.related('variationGroups').create({
      description: 'some description',
    });

    const unit = await Unit.create({
      name: 'some name',
      tag: 'some tag',
      type: UnitType.PRODUCT,
    });

    const product = await Product.create({
      description: 'some product',
      type: ProductType.PRODUCT,
      referenceCode: 'some reference code',
      collectionYear: 2022,
      ncm: 'some ncm',
      cest: 'some cest',
      features: 'some features',
      unit_id: unit.id,
      active: true,
      economic_group_id: group.id,
      variation_group_id: variationGroup.id,
      icmsOrigin: '0',
    });

    const variation = await ProductVariation.create({
      product_id: product.id,
      barcode: 'some barcode',
    });

    const productivity = await ProductivityItem.create({
      economic_group_id: group.id,

      description: 'some description',
    });

    const item = await productivity.related('products').create({
      economic_group_id: group.id,
      product_id: product.id,

      quantity: 10,
    });

    return { user, productivity, item, variation };
  };

  test('should return a list of items', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const params = new URLSearchParams({
      active: '1',
    });

    const response = await client
      .get(`/productivity-items/items?${params.toString()}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should return a list of item products', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const params = new URLSearchParams({
      active: '1',
      product: v4(),
    });

    const response = await client
      .get(`/productivity-items/products?${params.toString()}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should create an productivity item', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/productivity-items/create-item`)
      .json({
        description: 'some',
        reservedMinutes: 10,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update an productivity item', async ({ client, assert }) => {
    const { user, productivity } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/productivity-items/update-item`)
      .json({
        id: productivity.id,
        description: 'some',
        reservedMinutes: 10,
        active: true,
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should create an productivity item product', async ({
    client,
    assert,
  }) => {
    const { user, productivity, variation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/productivity-items/create-item-product`)
      .json({
        items: [
          {
            productivityItemId: productivity.id,
            productId: variation.product_id,
            quantity: 10,
          },
        ],
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update an productivity item product', async ({
    client,
    assert,
  }) => {
    const { user, item } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/productivity-items/update-item-product`)
      .json({
        id: item.id,
        quantity: 10,
        active: true,
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
