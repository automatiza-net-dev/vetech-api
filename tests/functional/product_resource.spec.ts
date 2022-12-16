import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Group from 'App/Models/Group';
import Product, { ProductType } from 'App/Models/Product';
import Subgroup from 'App/Models/Subgroup';
import TaxationGroup from 'App/Models/TaxationGroup';
import Unit, { UnitType } from 'App/Models/Unit';
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

    const groupEntity = await Group.create({
      name: 'some description',
      economic_group_id: group.id,
    });

    const subgroupEntity = await Subgroup.create({
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

    const taxationGroup = await TaxationGroup.create({
      name: 'some name',
      active: true,
      economic_group_id: group.id,
    });

    return {
      user,
      product,
      variationGroup,
      business,
      groupEntity,
      subgroupEntity,
      unit,
      taxationGroup,
    };
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
    const {
      user,
      variationGroup,
      groupEntity,
      subgroupEntity,
      unit,
      taxationGroup,
    } = await createData();
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
        unitId: unit.id,
        icmsOrigin: '0',
        variationGroup: variationGroup.id,
        groupId: groupEntity.id,
        subgroupId: subgroupEntity.id,
        taxationGroupId: taxationGroup.id,
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
              commission: 10,
              meta: 10,
              metaType: 'q',
              commissionMeta: 10,
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
    const {
      user,
      variationGroup,
      business,
      groupEntity,
      subgroupEntity,
      unit,
      taxationGroup,
    } = await createData();
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
        unitId: unit.id,
        icmsOrigin: '0',
        variationGroup: variationGroup.id,
        groupId: groupEntity.id,
        subgroupId: subgroupEntity.id,
        taxationGroupId: taxationGroup.id,
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
              commission: 10,
              meta: 10,
              metaType: 'q',
              commissionMeta: 10,
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
                  commission: 10,
                  meta: 10,
                  metaType: 'q',
                  commissionMeta: 10,
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
    const { user, product, subgroupEntity, groupEntity, unit, taxationGroup } =
      await createData();
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
        unitId: unit.id,
        active: true,
        groupId: groupEntity.id,
        taxationGroupId: taxationGroup.id,
        subgroupId: subgroupEntity.id,
        icmsOrigin: '0',
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
