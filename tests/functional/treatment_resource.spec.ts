import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Bill, { BillStatus } from 'App/Models/Bill';
import { DailyCashierStatus } from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import Kit from 'App/Models/Kit';
import { PatientType } from 'App/Models/Patient';
import { ProductType } from 'App/Models/Product';
import Treatment from 'App/Models/Treatment';
import Unit, { UnitType } from 'App/Models/Unit';
import PatientFactory from 'Database/factories/PatientFactory';
import { DateTime } from 'luxon';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Treatment resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const tutor = await PatientFactory.create();
    await tutor.merge({ type: PatientType.TUTOR }).save();
    await tutor.related('tutor').create({
      email: 'some',
      cellphone: 'some',
      telephone: 'some',
      state: 'PR',
    });

    const dailyMovement = await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyMovementStatus.A,
    });
    const dailyCashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.A,
    });

    const bill = await Bill.create({
      economic_group_id: group.id,
      business_unit_id: business.id,
      user_id: user.id,
      seller_id: user.id,
      client_id: tutor.id,
      daily_movement_id: dailyMovement.id,
      daily_cashier_id: dailyCashier.id,
      status: BillStatus.A,
      tag: '2023_00001',
    });

    const treatment = await Treatment.create({
      economic_group_id: group.id,
      business_unit_id: business.id,

      bill_id: bill.id,
      emission_user_id: user.id,
      client_id: tutor.id,
      seller_id: user.id,

      emissionDate: DateTime.now(),
      status: 'Confirmado',
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

    const kit = await Kit.create({
      description: 'some description',
      fromExpiration: DateTime.now(),
      toExpiration: DateTime.now(),
      economic_group_id: business.economicGroupId,
    });

    return { user, bill, tutor, treatment, variation, kit };
  };

  test('should create a treatment without bill', async ({ assert, client }) => {
    const { user, tutor } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/treatments/create`)
      .json({
        clientId: tutor.id,
        sellerId: user.id,
        emissionDate: DateTime.now().toISODate(),
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create a treatment with bill', async ({ assert, client }) => {
    const { user, tutor, bill } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/treatments/create`)
      .json({
        billId: bill.id,
        clientId: tutor.id,
        sellerId: user.id,
        emissionDate: DateTime.now().toISODate(),
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create a treatment item', async ({ assert, client }) => {
    const { user, variation, treatment } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/treatments/create-item`)
      .json({
        treatmentId: treatment.id,
        productVariationId: variation.id,

        quantity: 10,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create a treatment item (with kit)', async ({
    assert,
    client,
  }) => {
    const { user, variation, treatment, kit } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/treatments/create-item`)
      .json({
        treatmentId: treatment.id,
        productVariationId: variation.id,
        kitId: kit.id,

        quantity: 10,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });
});
