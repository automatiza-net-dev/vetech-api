import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { DailyCashierStatus } from 'App/Models/DailyCashier';
import {
  DailyCashierEntryStatus,
  DailyCashierEntryType,
} from 'App/Models/DailyCashierEntry';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import { DateTime } from 'luxon';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Daily cashier resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business } = await userBootstrap();

    const dailyMovement = await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyMovementStatus.A,
    });

    return { user, business, dailyMovement };
  };

  test('should return all daily cashiers', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/daily-cashiers').bearerToken(token);

    assert.equal(response.status(), 200);
  });

  test('should return daily cashier info', async ({ client, assert }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.A,
      tag: 1,
    });

    await cashier.related('entries').createMany([
      {
        type: DailyCashierEntryType.D,
        business_unit_id: dailyMovement.business_unit_id,
        description: 'some description',
        value: 100,
        status: DailyCashierEntryStatus.A,
        entryDate: DateTime.now(),
        tag: cashier.tag,
      },
      {
        type: DailyCashierEntryType.C,
        business_unit_id: dailyMovement.business_unit_id,
        description: 'some description',
        value: 100,
        status: DailyCashierEntryStatus.A,
        entryDate: DateTime.now(),
        tag: cashier.tag,
      },
    ]);

    const response = await client
      .get(`/daily-cashiers/info/${cashier.id}`)
      .bearerToken(token);

    assert.equal(response.status(), 200);
  });

  test('should throw BadRequestException if daily movement is not opened', async ({
    assert,
    client,
  }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await dailyMovement.merge({ status: DailyMovementStatus.F }).save();

    const response = await client
      .post(`/daily-cashiers/open`)
      .json({
        dailyMovementId: dailyMovement.id,
        userId: user.id,
        openingDate: DateTime.now(),
        initialBalance: 100,
      })
      .bearerToken(token);

    assert.equal(response.status(), 400);
    assert.equal(
      response.body().message,
      'E_DAILY_MOVEMENT_NOT_OPENED: Movimento diário não está aberto',
    );
  });

  test('should throw BadRequestException if daily cashier is open for te user', async ({
    assert,
    client,
  }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.A,
    });

    const response = await client
      .post(`/daily-cashiers/open`)
      .json({
        dailyMovementId: dailyMovement.id,
        userId: user.id,
        openingDate: DateTime.now(),
        initialBalance: 100,
      })
      .bearerToken(token);

    assert.equal(response.status(), 400);
    assert.equal(
      response.body().message,
      'E_DAILY_CASHIER_ALREADY_OPENED: Caixa já está aberto para este usuário',
    );
  });

  test('should create new daily cashier for te user', async ({
    assert,
    client,
  }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-cashiers/open`)
      .json({
        dailyMovementId: dailyMovement.id,
        userId: user.id,
        openingDate: DateTime.now(),
        initialBalance: 100,
      })
      .bearerToken(token);

    assert.equal(response.status(), 201);
  });

  test('should throw BadRequestException if daily cashier is not opened when closing', async ({
    assert,
    client,
  }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await dailyMovement.merge({ status: DailyMovementStatus.F }).save();

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.C,
    });

    const response = await client
      .post(`/daily-cashiers/close/${cashier.id}`)
      .json({
        userId: user.id,
        closingDate: DateTime.now(),
        cashierTotal: 100,
      })
      .bearerToken(token);

    assert.equal(response.status(), 400);
    assert.equal(
      response.body().message,
      'E_DAILY_CASHIER_NOT_OPENED: Caixa diário não está aberto',
    );
  });

  test('should close daily cashier', async ({ assert, client }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await dailyMovement.merge({ status: DailyMovementStatus.F }).save();

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.A,
    });

    const response = await client
      .post(`/daily-cashiers/close/${cashier.id}`)
      .json({
        userId: user.id,
        closingDate: DateTime.now(),
        cashierTotal: 100,
      })
      .bearerToken(token);

    assert.equal(response.status(), 200);
    assert.equal(response.body().status, DailyCashierStatus.F);
  });

  test('should throw BadRequestException if daily cashier is being reopen with invalid status', async ({
    assert,
    client,
  }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.C,
    });

    const response = await client
      .post(`/daily-cashiers/reopen/${cashier.id}`)
      .json({
        userId: user.id,
        closingDate: DateTime.now(),
        cashierTotal: 100,
      })
      .bearerToken(token);

    assert.equal(response.status(), 400);
    assert.equal(
      response.body().message,
      'E_DAILY_CASHIER_NOT_CLOSED: Caixa diário não está fechado',
    );
  });

  test('should throw BadRequestException if daily cashier is being reopen with a user with open cashier', async ({
    assert,
    client,
  }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.A,
    });

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.F,
    });

    const response = await client
      .post(`/daily-cashiers/reopen/${cashier.id}`)
      .bearerToken(token);

    assert.equal(response.status(), 400);
    assert.equal(
      response.body().message,
      'E_DAILY_CASHIER_ALREADY_OPENED: Já existe um caixa diário aberto para este usuário',
    );
  });

  test('should reopen daily cashier', async ({ assert, client }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.F,
      tag: 1,
    });

    const response = await client
      .post(`/daily-cashiers/reopen/${cashier.id}`)
      .bearerToken(token);

    assert.equal(response.status(), 200);
    assert.equal(response.body().status, DailyCashierStatus.A);
  });

  test('should throw BadRequestException if checking a daily cashier with invalid status', async ({
    assert,
    client,
  }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.A,
    });

    const response = await client
      .post(`/daily-cashiers/check/${cashier.id}`)
      .json({
        userId: user.id,
        checkingDate: DateTime.now(),
        observations: 'test',
      })
      .bearerToken(token);

    assert.equal(response.status(), 400);
    assert.equal(
      response.body().message,
      'E_DAILY_CASHIER_NOT_CLOSED: Caixa diário não está fechado',
    );
  });

  test('should check a daily cashier', async ({ assert, client }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.F,
    });

    const response = await client
      .post(`/daily-cashiers/check/${cashier.id}`)
      .json({
        userId: user.id,
        checkingDate: DateTime.now(),
        observations: 'test',
      })
      .bearerToken(token);

    assert.equal(response.status(), 200);
    assert.equal(response.body().status, DailyCashierStatus.C);
  });

  test('should throw BadRequestException if daily cashier is being reviewed with invalid status', async ({
    assert,
    client,
  }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.A,
    });

    const response = await client
      .post(`/daily-cashiers/review/${cashier.id}`)
      .json({
        userId: user.id,
        revisionDate: DateTime.now(),
        observations: 'test',
      })
      .bearerToken(token);

    assert.equal(response.status(), 400);
    assert.equal(
      response.body().message,
      'E_DAILY_CASHIER_NOT_CLOSED: Caixa diário não está fechado',
    );
  });

  test('should check a daily cashier', async ({ assert, client }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.F,
    });

    const response = await client
      .post(`/daily-cashiers/review/${cashier.id}`)
      .json({
        userId: user.id,
        revisionDate: DateTime.now(),
        observations: 'test',
      })
      .bearerToken(token);

    assert.equal(response.status(), 200);
    assert.equal(response.body().status, DailyCashierStatus.R);
  });

  test('should throw BadRequestException if adding expense on invalid status cashier', async ({
    assert,
    client,
  }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.C,
    });

    const response = await client
      .post(`/daily-cashiers/expense/${cashier.id}`)
      .json({
        description: 'test',
        value: 100,
        entryDate: DateTime.now(),
      })
      .bearerToken(token);

    assert.equal(response.status(), 400);
    assert.equal(
      response.body().message,
      'E_DAILY_CASHIER_NOT_OPENED: Caixa diário não está aberto',
    );
  });

  test('should create new cashier expense', async ({ assert, client }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.A,
    });

    const response = await client
      .post(`/daily-cashiers/expense/${cashier.id}`)
      .json({
        description: 'test',
        value: 100,
        entryDate: DateTime.now(),
      })
      .bearerToken(token);

    assert.equal(response.status(), 204);
  });

  test('should throw BadRequestException if adding receipt on invalid status cashier', async ({
    assert,
    client,
  }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.C,
    });

    const response = await client
      .post(`/daily-cashiers/receipt/${cashier.id}`)
      .json({
        description: 'test',
        value: 100,
        entryDate: DateTime.now(),
      })
      .bearerToken(token);

    assert.equal(response.status(), 400);
    assert.equal(
      response.body().message,
      'E_DAILY_CASHIER_NOT_OPENED: Caixa diário não está aberto',
    );
  });

  test('should create new cashier receipt', async ({ assert, client }) => {
    const { user, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const cashier = await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.A,
    });

    const response = await client
      .post(`/daily-cashiers/receipt/${cashier.id}`)
      .json({
        description: 'test',
        value: 100,
        entryDate: DateTime.now(),
      })
      .bearerToken(token);

    assert.equal(response.status(), 204);
  });
});
