import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnitMeta from 'App/Models/BusinessUnitMeta';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Business Units Metas resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business } = await userBootstrap();

    const meta = await BusinessUnitMeta.create({
      business_unit_id: business.id,
      type: 'Faturamento',
      value: 100,
      valueType: 'Valor R$',
      period: 'Ano',
    });

    return { user, meta };
  };

  test('should get all metas', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client.get('/business-unit-metas').bearerToken(token);

    assert.equal(200, result.status());
    assert.isArray(result.body());
  });

  test('should create meta', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .post('/business-unit-metas')
      .json({
        type: 'Faturamento',
        value: 100,
        valueType: 'Valor R$',
        period: 'Ano',
      })
      .bearerToken(token);

    assert.equal(201, result.status());
  });

  test('should update meta', async ({ assert, client }) => {
    const { user, meta } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .put(`/business-unit-metas/${meta.id}`)
      .json({
        type: 'Faturamento',
        value: 100,
        valueType: 'Valor R$',
        period: 'Ano',
        active: true,
      })
      .bearerToken(token);

    assert.equal(204, result.status());
  });

  test('should return metas', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client.get('/business-unit-metas').bearerToken(token);

    assert.equal(200, result.status());
  });

  test('should return single metas', async ({ assert, client }) => {
    const { user, meta } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .get(`/business-unit-metas/${meta.id}`)
      .bearerToken(token);

    assert.equal(200, result.status());
  });

  test('should delete meta', async ({ assert, client }) => {
    const { user, meta } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .delete(`/business-unit-metas/${meta.id}`)
      .bearerToken(token);

    assert.equal(204, result.status());
  });
});
