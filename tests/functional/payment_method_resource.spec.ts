import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import CheckingAccount, {
  CheckingAccountType,
} from 'App/Models/CheckingAccount';
import PaymentMethod, {
  PaymentMethodTef,
  PaymentMethodType,
} from 'App/Models/PaymentMethod';
import PaymentMethodFlag from 'App/Models/PaymentMethodFlag';
import TefAcquirer from 'App/Models/TefAcquirer';
import TefFlag, { TefFlagType } from 'App/Models/TefFlag';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Payment method resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business } = await userBootstrap();

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

    const checkingAccount = await CheckingAccount.create({
      economic_group_id: group.id,
      business_unit_id: business.id,
      description: 'some description',
      accountNumber: 'some',
      bankCode: 'some',
      bankName: 'some',
      agency: 'some',
      type: CheckingAccountType.CC,
      balance: 0,

      limit: 0,
      agencyPhone: 'some',
      managerName: 'some',
      managerEmail: 'some',
      managerPhone: 'some',
    });

    const tefAcq = await TefAcquirer.create({
      economic_group_id: group.id,
      description: 'any description',
    });

    const tefFlag = await TefFlag.create({
      economic_group_id: group.id,
      description: 'any description',
      code: 'any code',
      type: TefFlagType.A,
    });

    return { user, paymentMethod, checkingAccount, tefAcq, tefFlag };
  };

  test('should create a payment method', async ({ client, assert }) => {
    const { user, checkingAccount } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/payment-methods/create`)
      .json({
        description: 'some description',
        requiresDocument: true,
        tef: 'TEF',
        automaticCancellation: true,
        daysFirstInstallment: 10,
        daysBetweenInstallments: 30,
        allowChangeExpirationDate: true,
        minimumInstallmentValue: 10,
        type: PaymentMethodType.C,
        checkingAccountId: checkingAccount.id,
        daysUntilTransfer: 10,
        installmentsWithoutPassword: 2,
        maxInstallments: 12,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update a payment method', async ({ client, assert }) => {
    const { user, paymentMethod, checkingAccount } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/payment-methods/update/${paymentMethod.id}`)
      .json({
        description: 'some description',
        requiresDocument: true,
        tef: 'TEF',
        automaticCancellation: true,
        daysFirstInstallment: 10,
        daysBetweenInstallments: 30,
        allowChangeExpirationDate: true,
        minimumInstallmentValue: 10,
        type: PaymentMethodType.C,
        checkingAccountId: checkingAccount.id,
        daysUntilTransfer: 10,
        installmentsWithoutPassword: 2,
        maxInstallments: 12,
        fee: 10.99,
        active: true,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should create a payment method flag', async ({ client, assert }) => {
    const { user, paymentMethod, checkingAccount, tefAcq, tefFlag } =
      await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/payment-methods/create-flag`)
      .json({
        paymentMethodId: paymentMethod.id,
        tefFlagId: tefFlag.id,
        tefAcquirerId: tefAcq.id,
        checkingAccountId: checkingAccount.id,
        maxInstallments: 10,
        daysUntilTransfer: 10,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw BadRequestException when creating a payment method flag with existing flag', async ({
    client,
    assert,
  }) => {
    const { user, paymentMethod, checkingAccount, tefAcq, tefFlag } =
      await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await PaymentMethodFlag.create({
      economic_group_id: paymentMethod.economicGroupId,
      payment_method_id: paymentMethod.id,
      tef_flag_id: tefFlag.id,
      tef_acquirer_id: tefAcq.id,
      checking_account_id: checkingAccount.id,
      maxInstallments: 10,
    });

    const response = await client
      .post(`/payment-methods/create-flag`)
      .json({
        paymentMethodId: paymentMethod.id,
        tefFlagId: tefFlag.id,
        tefAcquirerId: tefAcq.id,
        checkingAccountId: checkingAccount.id,
        maxInstallments: 10,
        daysUntilTransfer: 10,
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should update a payment method flag', async ({ client, assert }) => {
    const { user, paymentMethod, checkingAccount, tefAcq, tefFlag } =
      await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const flag = await PaymentMethodFlag.create({
      economic_group_id: paymentMethod.economicGroupId,
      payment_method_id: paymentMethod.id,
      tef_flag_id: tefFlag.id,
      tef_acquirer_id: tefAcq.id,
      checking_account_id: checkingAccount.id,
      maxInstallments: 10,
    });
    await flag.related('installments').createMany([
      {
        installment: 1,
        fee: 0,
      },
      {
        installment: 2,
        fee: 0,
      },
    ]);

    const response = await client
      .put(`/payment-methods/update-flag/${flag.id}`)
      .json({
        paymentMethodId: paymentMethod.id,
        tefFlagId: tefFlag.id,
        tefAcquirerId: tefAcq.id,
        checkingAccountId: checkingAccount.id,
        maxInstallments: 1,
        active: true,
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should create a payment method fee', async ({ client, assert }) => {
    const { user, paymentMethod, checkingAccount, tefAcq, tefFlag } =
      await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const flag = await PaymentMethodFlag.create({
      economic_group_id: paymentMethod.economicGroupId,
      payment_method_id: paymentMethod.id,
      tef_flag_id: tefFlag.id,
      tef_acquirer_id: tefAcq.id,
      checking_account_id: checkingAccount.id,
      maxInstallments: 10,
    });

    const response = await client
      .post(`/payment-methods/create-fee`)
      .json({
        paymentMethodId: paymentMethod.id,
        paymentMethodFlagId: flag.id,
        installments: 10,
        fee: 3,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should search for tef flags (C)', async ({ client, assert }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const qs = new URLSearchParams({
      type: 'C',
    });

    const response = await client
      .get(`/payment-methods/tef-flags?${qs.toString()}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should search for tef flags (D)', async ({ client, assert }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const qs = new URLSearchParams({
      type: 'D',
    });

    const response = await client
      .get(`/payment-methods/tef-flags?${qs.toString()}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });
});
