import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Product, { ProductType } from 'App/Models/Product';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';
import { v4 } from 'uuid';

import { createSudo, generateJwtToken, userBootstrap } from '../utils';

test.group('Schedule service type resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business } = await userBootstrap();

    const schedule = await ScheduleServiceGroup.create({
      economic_group_id: group.id,
      description: 'some schedule',
    });

    const groupType = await schedule.related('types').create({
      id: v4(),
      economic_group_id: group.id,
      description: 'some schedule',
      reservedMinutes: 90,
    });

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

    return { user, group, schedule, business, groupType, product };
  };

  test('should create schedule group type', async ({ assert, client }) => {
    const { user, schedule, product } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/schedule-service-groups')
      .json({
        description: 'some schedule',
        reversedMinutes: 90,
        scheduleServiceGroupId: schedule.id,
        productId: product.id,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(201, response.status());
    assert.equal('some schedule', body.description);
  });

  test('should return a list of schedule service types', async ({
    assert,
    client,
  }) => {
    const { user, groupType } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get('/schedule-service-types')
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.isTrue(Boolean(body.find(b => b.id === groupType.id)));
  });

  test('should throw ResourceNotFoundException if no schedule service type was found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/schedule-service-types/${v4()}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Recurso não encontrado', body.message);
  });

  test('should return group type for super admin', async ({
    assert,
    client,
  }) => {
    const { groupType } = await createData();
    const { user: user2, business } = await createData();
    const [sudoRole] = await createSudo();
    await user2.related('roles').create({
      role_id: sudoRole.id,
      unit_id: business.id,
    });

    const token = await generateJwtToken(client, {
      email: user2.email,
      password: '102030',
    });

    const response = await client
      .get(`/schedule-service-types/${groupType.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(groupType.id, body.id);
  });

  test('should throw ResourceNotFoundException if no schedule service type was found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/schedule-service-types/${v4()}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Recurso não encontrado', body.message);
  });

  test('should return any schedule group type for super admin', async ({
    assert,
    client,
  }) => {
    const { groupType } = await createData();
    const { user: user2, business: businessUnit } = await createData();
    const [sudoRole] = await createSudo();
    await user2.related('roles').create({
      role_id: sudoRole.id,
      unit_id: businessUnit.id,
    });

    const token = await generateJwtToken(client, {
      email: user2.email,
      password: '102030',
    });

    const response = await client
      .get(`/schedule-service-types/${groupType.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(groupType.id, body.id);
  });

  test('should return schedule service type', async ({ assert, client }) => {
    const { user, groupType } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/schedule-service-types/${groupType.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(groupType.id, body.id);
  });
});
