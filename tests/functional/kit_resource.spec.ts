import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { BusinessUnitProductMetaType } from 'App/Models/BusinessUnitProduct';
import Kit from 'App/Models/Kit';
import { ProductType } from 'App/Models/Product';
import Unit, { UnitType } from 'App/Models/Unit';
import { IUpsertKitItemData } from 'Contracts/interfaces/IKitData';
import { DateTime } from 'luxon';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('kit resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const kit = await Kit.create({
      description: 'some description',
      fromExpiration: DateTime.now(),
      toExpiration: DateTime.now(),
      economic_group_id: business.economicGroupId,
    });

    const unit = await Unit.create({
      name: 'some name',
      tag: 'some tag',
      type: UnitType.PRODUCT,
    });

    const product = await group.related('products').create({
      description: 'some product',
      type: ProductType.PRODUCT,
      referenceCode: 'some reference code',
      collectionYear: 2022,
      ncm: 'some ncm',
      cest: 'some cest',
      features: 'some features',
      unit_id: unit.id,
      active: true,
    });

    const variation = await product.related('variations').create({
      barcode: '123',
    });

    await variation.related('businessUnitProducts').create({
      businness_unit_id: business.id,
      price: 10,
      stock: 10,
      maximumStock: 10,
      minimumStock: 10,
      maximumDiscountPercentage: 10,
      commission: 10,
      commissionMeta: 10,
      costPrice: 10,
      maximumDiscountValue: 10,
      meta: 10,
      metaType: BusinessUnitProductMetaType.Quantidade,
      profitMargin: 10,
    });

    const kitItem = await kit.related('items').create({
      product_variation_id: variation.id,
      quantity: 10,
      discountPrice: 10,
      discountPercentage: 10,
      salePrice: 10,
      originalPrice: 10,
      business_unit_id: business.id,
    });

    return { user, kit, variation, kitItem };
  };

  test('should return all kits', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const qs = new URLSearchParams({
      id: '1',
      productCode: 'some',
      description: 'asd',
      fromExpiration: new Date().toISOString(),
      toExpiration: new Date().toISOString(),
    });
    const response = await client
      .get(`/kits?${qs.toString()}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create kit', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/kits`)
      .json({
        description: 'some description',
        fromExpiration: new Date(),
        toExpiration: new Date(),
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw NotFoundException if no kit is found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/kits/${-1}`).bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should throw NotFoundException if kit does not belong to unit', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const { kit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/kits/${kit.id}`).bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should return kit', async ({ assert, client }) => {
    const { user, kit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/kits/${kit.id}`).bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(kit.id, response.body().id);
  });

  test('should update kit', async ({ assert, client }) => {
    const { user, kit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/kits/${kit.id}`)
      .json({
        description: 'some description',
        fromExpiration: new Date(),
        toExpiration: new Date(),
        active: true,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(kit.id, response.body().id);
  });

  test('should soft delete kit', async ({ assert, client }) => {
    const { user, kit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.delete(`/kits/${kit.id}`).bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should add item to kit', async ({ assert, client }) => {
    const { user, kit, variation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/kits/add-item`)
      .json({
        kitId: kit.id,
        productVariationId: variation.id,
        discountPercentage: 0,
        discountPrice: 0,
        quantity: 0,
      } as IUpsertKitItemData)
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should throw BadRequestException if discount is bigger than max discount', async ({
    assert,
    client,
  }) => {
    const { user, kit, variation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/kits/add-item`)
      .json({
        kitId: kit.id,
        productVariationId: variation.id,
        discountPercentage: 0,
        discountPrice: 1000,
        quantity: 0,
      } as IUpsertKitItemData)
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should update item from kit', async ({ assert, client }) => {
    const { user, variation, kitItem } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/kits/item/${kitItem.id}`)
      .json({
        productVariationId: variation.id,
        discountPercentage: 0,
        discountPrice: 0,
        quantity: 0,
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should throw BadRequestException if no item was found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.delete(`/kits/item/${-1}`).bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should delete item from kit', async ({ assert, client }) => {
    const { user, kitItem } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/kits/item/${kitItem.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
