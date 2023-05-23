import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Bill, { BillStatus } from 'App/Models/Bill';
import { DailyCashierStatus } from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import Kit from 'App/Models/Kit';
import { PatientType } from 'App/Models/Patient';
import { ProductType } from 'App/Models/Product';
import Reason from 'App/Models/Reason';
import Schedule from 'App/Models/Schedule';
import { SS_NOT_CONFIRMED } from 'App/Models/ScheduleStatus';
import Treatment from 'App/Models/Treatment';
import TreatmentExecution from 'App/Models/TreatmentExecution';
import TreatmentItem from 'App/Models/TreatmentItem';
import Unit, { UnitType } from 'App/Models/Unit';
import PatientFactory from 'Database/factories/PatientFactory';
import ScheduleServiceTypeFactory from 'Database/factories/ScheduleServiceTypeFactory';
import { DateTime } from 'luxon';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Treatment resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group, system } = await userBootstrap();

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

    const treatment = await Treatment.create({
      economic_group_id: group.id,
      business_unit_id: business.id,

      bill_id: bill.id,
      emission_user_id: user.id,
      client_id: tutor.id,
      seller_id: user.id,

      emissionDate: DateTime.now(),
      status: 'Aberto',
    });

    const item = await TreatmentItem.create({
      economic_group_id: group.id,
      business_unit_id: business.id,
      product_variation_id: variation.id,
      kit_id: kit.id,

      id: 1,
      treatment_id: treatment.id,
      quantity: 10,
      quantityExecuted: 0,
      status: 'Ativo',
    });

    const serviceType = await ScheduleServiceTypeFactory.create();
    const schedule = await Schedule.create({
      patientName: 'any name',
      patientPhone: 'any phone',
      holder_id: tutor.id,
      age: 2,
      startHour: DateTime.now(),
      endHour: DateTime.now(),
      majorComplaint: 'some complaint',
      business_unit_id: business.id,
      user_id: user.id,
      patient_id: tutor.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: SS_NOT_CONFIRMED,
    });

    const execution = await TreatmentExecution.create({
      economic_group_id: group.id,
      business_unit_id: business.id,
      schedule_id: schedule.id,
      schedule_user_id: user.id,

      id: 1,
      treatment_id: treatment.id,
      treatment_item_id: item.id,

      quantityExecuted: 1,
      scheduleDate: DateTime.now(),
      status: 'Ativo',
    });

    const reason = await Reason.create({
      reason: 'any reason',
      requiresObservation: true,
      type: 'RA',
      economicGroupId: group.id,
      system_id: system.id,
    });

    return {
      user,
      bill,
      tutor,
      treatment,
      variation,
      kit,
      item,
      schedule,
      execution,
      reason,
    };
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

  test('should create a treatment execution', async ({ assert, client }) => {
    const { user, treatment, item, schedule } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/treatments/create-execution`)
      .json({
        treatmentId: treatment.id,
        treatmentItemId: item.id,
        scheduleId: schedule.id,

        quantityExecuted: 5,
        scheduleDate: new Date().toISOString(),
        executionDate: new Date().toISOString(),
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw BadRequestException if executing completed execution', async ({
    assert,
    client,
  }) => {
    const { user, execution } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await execution.merge({ status: 'Confirmado' }).save();

    const response = await client
      .post(`/treatments/execute-execution`)
      .json({
        executionId: execution.id,

        executionDate: new Date().toISOString(),
        observations: 'some',
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should complete execution', async ({ assert, client }) => {
    const { user, execution } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/treatments/execute-execution`)
      .json({
        executionId: execution.id,

        executionDate: new Date().toISOString(),
        observations: 'some',
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should throw BadRequestException when cancelling treatment already cancelled', async ({
    assert,
    client,
  }) => {
    const { user, treatment, reason } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await treatment.merge({ status: 'Cancelado' }).save();

    const response = await client
      .post(`/treatments/cancel-treatment`)
      .json({
        treatmentId: treatment.id,
        reasonId: reason.id,

        cancellationDate: new Date().toISOString(),
        cancellationObservations: 'some',
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should cancel treatment', async ({ assert, client }) => {
    const { user, treatment, reason } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/treatments/cancel-treatment`)
      .json({
        treatmentId: treatment.id,
        reasonId: reason.id,

        cancellationDate: new Date().toISOString(),
        cancellationObservations: 'some',
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should fetch treatments', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/treatments/search`).bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should fetch treatments (with qs)', async ({ assert, client }) => {
    const { user, tutor } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const qs = new URLSearchParams();
    qs.append('from', '2021-01-01');
    qs.append('to', '2021-12-31');
    qs.append('patient', tutor.id);
    qs.append('tag', 'any');
    qs.append('status', 'any');

    const response = await client
      .get(`/treatments/search?${qs.toString()}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should throw BadRequestException if searching items with no treatment', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/treatments/search-items`)
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should fetch treatment items', async ({ assert, client }) => {
    const { user, treatment } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const qs = new URLSearchParams();
    qs.append('treatment', treatment.id.toString());

    const response = await client
      .get(`/treatments/search-items?${qs.toString()}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should throw BadRequestException if searching executions with no treatment', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/treatments/search-executions`)
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should fetch treatment executions', async ({ assert, client }) => {
    const { user, treatment, execution } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await execution
      .merge({
        execution_user_id: user.id,

        executionDate: DateTime.now(),
        observations: 'some',
      })
      .save();

    const qs = new URLSearchParams();
    qs.append('treatment', treatment.id.toString());

    const response = await client
      .get(`/treatments/search-executions?${qs.toString()}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should fetch scheduling', async ({ assert, client }) => {
    const { user, tutor } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const qs = new URLSearchParams();
    qs.append('client', tutor.id.toString());

    const response = await client
      .get(`/treatments/search-scheduling?${qs.toString()}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should update treatment execution', async ({ assert, client }) => {
    const { user, reason, execution, schedule } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/treatments/update-treatment`)
      .json({
        treatmentExecutionId: execution.id,
        reasonId: reason.id,
        scheduleId: schedule.id,

        observations: 'some',
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should throw BadRequestException if searching complete treatments with no treatment', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/treatments/search-complete`)
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should fetch complete treatments', async ({ assert, client }) => {
    const { user, treatment, reason } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await treatment
      .merge({
        cancellation_user_id: user.id,
        cancellationDate: DateTime.now(),

        cancellation_reason_id: reason.id,
        cancellationObservations: 'some',

        observations: 'some',
      })
      .save();

    const qs = new URLSearchParams();
    qs.append('treatment', treatment.id.toString());

    const response = await client
      .get(`/treatments/search-complete?${qs.toString()}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });
});
