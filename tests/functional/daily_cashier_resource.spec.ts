import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import AccountPlan from 'App/Models/AccountPlan';
import AccountPlanGroup, {
  AccountPlanGroupType,
} from 'App/Models/AccountPlanGroup';
import Bill, { BillStatus } from 'App/Models/Bill';
import { BillPaymentFeeType } from 'App/Models/BillPayment';
import { DailyCashierStatus } from 'App/Models/DailyCashier';
import {
  DailyCashierEntryStatus,
  DailyCashierEntryType,
} from 'App/Models/DailyCashierEntry';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import PaymentMethod, {
  PaymentMethodTef,
  PaymentMethodType,
} from 'App/Models/PaymentMethod';
import { DateTime } from 'luxon';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Daily cashier resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group, system } = await userBootstrap();

    const dailyMovement = await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyMovementStatus.A,
    });

    const apg = await AccountPlanGroup.create({
      economic_group_id: group.id,
      description: 'some description',
      type: AccountPlanGroupType.A,
      system_id: system.id,
    });

    const ap = await AccountPlan.create({
      business_unit_id: business.id,
      description: 'some description',
      code: 'some code',
      account_plan_group_id: apg.id,
      system_id: system.id,
    });

    const paymentMethod = await PaymentMethod.create({
      economicGroupId: group.id,
      description: 'some description',
      requiresDocument: true,
      tef: PaymentMethodTef.N,
      automaticCancellation: true,
      daysFirstInstallment: 10,
      daysBetweenInstallments: 10,
      allowChangeExpirationDate: false,
      minimumInstallmentValue: 10,
      type: PaymentMethodType.C,
      fee: 0,
      daysUntilTransfer: 0,
      installmentsWithoutPassword: 1,
      maxInstallments: 10,
    });

    return { user, business, dailyMovement, ap, paymentMethod };
  };

  test('should return all daily cashiers', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const urlParams = new URLSearchParams();
    urlParams.append('tag', '1');
    urlParams.append('openingUser', user.id);
    urlParams.append('status', DailyCashierStatus.A);
    urlParams.append('fromBalance', '100');
    urlParams.append('toBalance', '100');
    urlParams.append('fromOpening', new Date().toISOString());
    urlParams.append('toOpening', new Date().toISOString());
    urlParams.append('fromClosing', new Date().toISOString());
    urlParams.append('toClosing', new Date().toISOString());
    urlParams.append('fromChecking', new Date().toISOString());
    urlParams.append('toChecking', new Date().toISOString());
    const response = await client
      .get(`/daily-cashiers?${urlParams.toString()}`)
      .bearerToken(token);

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
    const { user, dailyMovement, business } = await createData();
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
      openingBalance: 0,
      cashierTotal: 0,
    });

    const bill = await Bill.create({
      economic_group_id: business.economicGroupId,
      business_unit_id: dailyMovement.business_unit_id,
      user_id: user.id,
      seller_id: user.id,
      daily_movement_id: dailyMovement.id,
      status: BillStatus.A,
      totalValue: 100,
      daily_cashier_id: cashier.id,
    });
    await bill.related('payments').create({
      economic_group_id: business.economicGroupId,
      business_unit_id: business.id,
      block: 1,
      expirationDate: DateTime.now(),
      feeType: BillPaymentFeeType.N,
      feeValue: 0,
      feePercentage: 0,
      installments: 1,
      installmentValue: 10,
      totalValue: 10,
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
    const { user, dailyMovement, paymentMethod, ap } = await createData();
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

        paymentMethodId: paymentMethod.id,
        accountPlanId: ap.id,
        fiscalNote: 'some',
      })
      .bearerToken(token);

    assert.equal(response.status(), 400);
    assert.equal(
      response.body().message,
      'E_DAILY_CASHIER_NOT_OPENED: Caixa diário não está aberto',
    );
  });

  test('should create new cashier expense', async ({ assert, client }) => {
    const { user, dailyMovement, paymentMethod, ap } = await createData();
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

        paymentMethodId: paymentMethod.id,
        accountPlanId: ap.id,
        fiscalNote: 'some',
      })
      .bearerToken(token);

    assert.equal(response.status(), 204);
  });

  test('should create new cashier expense (opt vals)', async ({
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
    const { user, dailyMovement, ap, paymentMethod } = await createData();
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
        paymentMethodId: paymentMethod.id,
        accountPlanId: ap.id,
        fiscalNote: 'some',
      })
      .bearerToken(token);

    assert.equal(response.status(), 400);
    assert.equal(
      response.body().message,
      'E_DAILY_CASHIER_NOT_OPENED: Caixa diário não está aberto',
    );
  });

  test('should create new cashier receipt', async ({ assert, client }) => {
    const { user, dailyMovement, paymentMethod, ap } = await createData();
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

        paymentMethodId: paymentMethod.id,
        accountPlanId: ap.id,
        fiscalNote: 'some',
      })
      .bearerToken(token);

    assert.equal(response.status(), 204);
  });

  test('should create new cashier receipt (opt vals)', async ({
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
