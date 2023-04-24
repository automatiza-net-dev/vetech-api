import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Product, { ProductType } from 'App/Models/Product';
import ScheduleServiceGroup, {
  ScheduleServiceGroupType,
} from 'App/Models/ScheduleServiceGroup';
import Unit, { UnitType } from 'App/Models/Unit';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

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
      type: ScheduleServiceGroupType.R,
    });

    const groupType = await schedule.related('types').create({
      id: v4(),
      economic_group_id: group.id,
      description: 'some schedule',
      reservedMinutes: 90,
      allowReturn: true,
      resume: 'some resume',
    });

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
    });

    return { user, group, schedule, business, groupType, product, unit };
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
        resume: 'some resume',
        type: ScheduleServiceGroupType.R,
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
