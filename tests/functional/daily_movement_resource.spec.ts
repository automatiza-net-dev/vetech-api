import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { DailyCashierStatus } from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Daily movement resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business } = await userBootstrap();

    return { user, business };
  };

  test('should return all daily movements', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/daily-movements`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should throw BadRequestException if daily movement from another day is open', async ({
    assert,
    client,
  }) => {
    const { user, business } = await createData();
    await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now().minus({ days: 2 }),
      status: DailyMovementStatus.A,
    });

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/open`)
      .json({
        userId: user.id,
        openingDate: DateTime.now(),
      })
      .bearerToken(token);

    assert.equal(400, response.status());
    assert.equal(
      'E_DAILY_MOVEMENT_OPENED: Existe um movimento diário aberto do dia anterior',
      response.body().message,
    );
  });

  test('should throw BadRequestException if daily movement from today is already open', async ({
    assert,
    client,
  }) => {
    const { user, business } = await createData();
    await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now().minus({ seconds: 1 }),
      status: DailyMovementStatus.A,
    });

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/open`)
      .json({
        userId: user.id,
        openingDate: DateTime.now(),
      })
      .bearerToken(token);

    assert.equal(400, response.status());
    assert.equal(
      'E_DAILY_MOVEMENT_OPENED: Já existe um movimento diário aberto para hoje',
      response.body().message,
    );
  });

  test('should open a new daily movement', async ({ assert, client }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/open`)
      .json({
        userId: user.id,
        openingDate: DateTime.now(),
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw ResourceNotFoundException if daily movement is not found when closing', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/close/${v4()}`)
      .json({
        userId: user.id,
        closingDate: DateTime.now(),
        observations: 'Test',
      })
      .bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Movimento diário não encontrado',
      response.body().message,
    );
  });

  test('should throw BadRequestException if daily movement is already closed', async ({
    assert,
    client,
  }) => {
    const { user, business } = await createData();
    const movement = await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now().minus({ seconds: 1 }),
      status: DailyMovementStatus.F,
    });

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/close/${movement.id}`)
      .json({
        userId: user.id,
        closingDate: DateTime.now(),
        observations: 'Test',
      })
      .bearerToken(token);

    assert.equal(400, response.status());
    assert.equal(
      'E_DAILY_MOVEMENT_NOT_OPENED: Movimento diário não está aberto',
      response.body().message,
    );
  });

  test('should throw BadRequestException if daily movement has open daily cashier', async ({
    assert,
    client,
  }) => {
    const { user, business } = await createData();
    const movement = await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now().minus({ seconds: 1 }),
      status: DailyMovementStatus.F,
    });

    await movement.related('cashiers').create({
      user_who_opened_id: user.id,
      openingDate: DateTime.now().minus({ seconds: 1 }),
      status: DailyCashierStatus.A,
    });

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/close/${movement.id}`)
      .json({
        userId: user.id,
        closingDate: DateTime.now(),
        observations: 'Test',
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should close a daily movement', async ({ assert, client }) => {
    const { user, business } = await createData();
    const movement = await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now().minus({ seconds: 1 }),
      status: DailyMovementStatus.A,
    });

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/close/${movement.id}`)
      .json({
        userId: user.id,
        closingDate: DateTime.now(),
        observations: 'Test',
      })
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should throw ResourceNotFoundException if daily movement is not found when reopening', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/reopen/${v4()}`)
      .json({
        userId: user.id,
        openingDate: DateTime.now(),
      })
      .bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Movimento diário não encontrado',
      response.body().message,
    );
  });

  test('should throw BadRequestException if daily movement is already checked when reopening', async ({
    assert,
    client,
  }) => {
    const { user, business } = await createData();
    const movement = await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now().minus({ seconds: 1 }),
      status: DailyMovementStatus.C,
    });

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/reopen/${movement.id}`)
      .json({
        userId: user.id,
        openingDate: DateTime.now(),
      })
      .bearerToken(token);

    assert.equal(400, response.status());
    assert.equal(
      'E_DAILY_MOVEMENT_CHECKED: Movimento diário já foi conferido',
      response.body().message,
    );
  });

  test('should throw BadRequestException if daily movement is from another day when reopening', async ({
    assert,
    client,
  }) => {
    const { user, business } = await createData();
    const movement = await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now().minus({ day: 1 }),
      status: DailyMovementStatus.F,
    });

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/reopen/${movement.id}`)
      .bearerToken(token);

    assert.equal(400, response.status());
    assert.equal(
      'E_DAILY_MOVEMENT_NOT_SAME_DAY: Movimento diário só pode ser reaberto no mesmo dia',
      response.body().message,
    );
  });

  test('should reopen a daily movement', async ({ assert, client }) => {
    const { user, business } = await createData();
    const movement = await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now().minus({ seconds: 1 }),
      status: DailyMovementStatus.F,
    });

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/reopen/${movement.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(DailyMovementStatus.A, body.status);
    assert.isNull(body.closing_date);
    assert.equal(0, body.sales_total);
    assert.equal(0, body.expenses_total);
    assert.equal(0, body.receipts_total);
  });

  test('should throw ResourceNotFoundException if daily movement is not found when checking', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/check/${v4()}`)
      .json({
        userId: user.id,
        checkingDate: DateTime.now(),
        observations: 'Test',
      })
      .bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Movimento diário não encontrado',
      response.body().message,
    );
  });

  test('should throw BadRequestException if daily movement is not closed when checking', async ({
    assert,
    client,
  }) => {
    const { user, business } = await createData();
    const movement = await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now().minus({ seconds: 1 }),
      status: DailyMovementStatus.A,
    });

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/check/${movement.id}`)
      .json({
        userId: user.id,
        checkingDate: DateTime.now(),
        observations: 'Test',
      })
      .bearerToken(token);

    assert.equal(400, response.status());
    assert.equal(
      'E_DAILY_MOVEMENT_NOT_CLOSED: Movimento diário não está fechado',
      response.body().message,
    );
  });

  test('should check a daily movement', async ({ assert, client }) => {
    const { user, business } = await createData();
    const movement = await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now().minus({ seconds: 1 }),
      status: DailyMovementStatus.F,
    });

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/daily-movements/check/${movement.id}`)
      .json({
        userId: user.id,
        checkingDate: DateTime.now(),
        observations: 'Test',
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(DailyMovementStatus.C, body.status);
    assert.equal('Test', body.observations);
  });
});
