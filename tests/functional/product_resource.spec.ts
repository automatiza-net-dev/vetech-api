import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { LicenceType } from 'App/Models/Licence';
import { ProductType } from 'App/Models/Product';
import RoleFactory from 'Database/factories/RoleFactory';
import UserFactory from 'Database/factories/UserFactory';
import { addDays } from 'date-fns';
import { v4 } from 'uuid';

import { generateJwtToken } from '../utils';

test.group('Product resource', group => {
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
