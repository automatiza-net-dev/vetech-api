import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Product, { ProductType } from 'App/Models/Product';
import Subgroup from 'App/Models/Subgroup';
import TaxationGroup from 'App/Models/TaxationGroup';
import Unit, { UnitType } from 'App/Models/Unit';
import { SERVICE_VARIATION_GROUP_ID } from 'Database/seeders/ServiceSeeder';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Service resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business } = await userBootstrap();

    const subgroupEntity = await Subgroup.create({
      description: 'some description',
    });

    const unit = await Unit.create({
      name: 'some name',
      tag: 'some tag',
      type: UnitType.PRODUCT,
    });

    const service = await Product.create({
      description: 'some product',
      type: ProductType.SERVICE,
      referenceCode: 'some reference code',
      features: 'some features',
      unit_id: unit.id,
      active: true,
      economic_group_id: group.id,
      variation_group_id: SERVICE_VARIATION_GROUP_ID,
      icmsOrigin: '0',
      ncm: '00',
    });

    const taxationGroup = await TaxationGroup.create({
      name: 'some name',
      active: true,
      economic_group_id: group.id,
    });

    return {
      user,
      service,
      business,
      subgroupEntity,
      unit,
      taxationGroup,
    };
  };

  test('should return a list of services', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/services').bearerToken(token);

    const body = response.body();

    assert.isArray(body);
  });

  test('should create a service', async ({ client, assert }) => {
    const { user, subgroupEntity, unit, taxationGroup } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/services')
      .json({
        description: 'service 1',
        subgroupId: subgroupEntity.id,
        taxationGroupId: taxationGroup.id,
        unitId: unit.id,
        referenceCode: '00001',
        features: 'some features',
        serviceCode: '10',
        price: {
          price: 2121.12,
          profitMargin: '2121',
          costPrice: 121.12,
          maximumDiscountPercentage: '2121',
          maximumDiscountValue: 21.21,
          commission: '2121',
          meta: '2121',
          metaType: 'v',
          commissionMeta: '2122',
        },
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw ResourceNotFound if no service is found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/services/${v4()}`).bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should return given service', async ({ client, assert }) => {
    const { user, service } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/services/${service.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(service.id, response.body().id);
  });

  test('should update a service', async ({ client, assert }) => {
    const { user, service, subgroupEntity, unit, taxationGroup } =
      await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/services/${service.id}`)
      .json({
        description: 'updated product',
        referenceCode: '00001',
        features: 'some features',
        unitId: unit.id,
        active: true,
        taxationGroupId: taxationGroup.id,
        subgroupId: subgroupEntity.id,
        serviceCode: '10',
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(service.id, body.id);
    assert.notEqual(service.description, body.description);
  });

  test('should soft delete a service', async ({ client, assert }) => {
    const { user, service } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/services/${service.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
