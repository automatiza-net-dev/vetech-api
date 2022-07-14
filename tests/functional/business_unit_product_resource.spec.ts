import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { LicenceType } from 'App/Models/Licence';
import { ProductType } from 'App/Models/Product';
import RoleFactory from 'Database/factories/RoleFactory';
import UserFactory from 'Database/factories/UserFactory';
import { addDays } from 'date-fns';
import { v4 } from 'uuid';

import { generateJwtToken } from '../utils';

test.group('Business unit product resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const user = await UserFactory.create();

    const newGroup = await user.related('economicGroups').create({
      id: v4(),
      document: user.document,
      responsibleEmail: user.email,
      responsiblePhone: user.phone,
    });

    const newBusinessUnit = await newGroup.related('businessUnits').create({
      id: v4(),
      document: user.document,
      phone: user.phone,
      email: user.email,
      origin: 'TESTING',
    });

    const role = await RoleFactory.create();

    await user.related('roles').create({
      role_id: role.id,
      unit_id: newBusinessUnit.id,
    });

    await newBusinessUnit.related('licences').create({
      id: v4(),
      active: true,
      expirationDate: addDays(new Date(), 1),
      type: LicenceType.TRIAL,
    });

    const product = await newGroup.related('products').create({
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

    const businessUnitProduct = await product
      .related('businessUnitProducts')
      .create({
        businness_unit_id: newBusinessUnit.id,
        stock: 10,
        price: 10,
        costPrice: 10,
        maximumStock: 10,
        minimumStock: 10,
        maximumDiscountPercentage: 10,
        maximumDiscountValue: 10,
        profitMargin: 10,
      });

    return { user, product, model: businessUnitProduct };
  };

  test('should return a list of business unit products', async ({
    client,
    assert,
  }) => {
    const { user, model } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get('/business-unit-products')
      .bearerToken(token);

    const body = response.body();

    assert.isArray(body);
    assert.isTrue(Boolean(body.find(f => f.id === model.id)));
  });

  test('should create a business unit product', async ({ client, assert }) => {
    const { user, product } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/business-unit-products')
      .json({
        productId: product.id,
        stock: 10,
        price: 10,
        costPrice: 10,
        maximumStock: 10,
        minimumStock: 10,
        maximumDiscountPercentage: 10,
        maximumDiscountValue: 10,
        profitMargin: 10,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw ResourceNotFound if no entity was found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/business-unit-products/${v4()}`)
      .bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should return given entity', async ({ client, assert }) => {
    const { user, model } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/business-unit-products/${model.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(model.id, response.body().id);
  });

  test('should update a entity', async ({ client, assert }) => {
    const { user, product, model } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/business-unit-products/${model.id}`)
      .json({
        productId: product.id,
        stock: 20,
        price: 10,
        costPrice: 10,
        maximumStock: 10,
        minimumStock: 10,
        maximumDiscountPercentage: 10,
        maximumDiscountValue: 10,
        profitMargin: 10,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(model.id, body.id);
    assert.notEqual(model.stock, body.stock);
  });

  test('should soft delete a entity', async ({ client, assert }) => {
    const { user, model } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/business-unit-products/${model.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
