import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnitMeta from 'App/Models/BusinessUnitMeta';
import Meta from 'App/Models/Meta';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Business Units Metas resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const meta = await Meta.create({
      economic_group_id: group.id,
      description: 'some description',
    });

    const buMeta = await BusinessUnitMeta.create({
      meta_id: meta.id,
      business_unit_id: business.id,
      value: 100,
      period: 'Ano',
    });

    return { user, buMeta, meta };
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
    const { user, meta, buMeta } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .post('/business-unit-metas')
      .json({
        metaId: meta.id,
        businessUnitId: buMeta.business_unit_id,
        value: 100,
        period: 'Ano',
      })
      .bearerToken(token);

    assert.equal(201, result.status());
  });

  test('should update meta', async ({ assert, client }) => {
    const { user, buMeta } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .put(`/business-unit-metas/${buMeta.id}`)
      .json({
        value: 100,
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
    const { user, buMeta } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .get(`/business-unit-metas/${buMeta.id}`)
      .bearerToken(token);

    assert.equal(200, result.status());
  });

  test('should delete meta', async ({ assert, client }) => {
    const { user, buMeta } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .delete(`/business-unit-metas/${buMeta.id}`)
      .bearerToken(token);

    assert.equal(204, result.status());
  });
});
