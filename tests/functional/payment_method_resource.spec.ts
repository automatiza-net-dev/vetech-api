import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import CheckingAccount, {
  CheckingAccountType,
} from 'App/Models/CheckingAccount';
import PaymentMethod, {
  PaymentMethodTef,
  PaymentMethodType,
} from 'App/Models/PaymentMethod';

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

    return { user, paymentMethod, checkingAccount };
  };

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
});
