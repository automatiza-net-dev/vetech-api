import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import AccountPlan, { AccountPlanType } from 'App/Models/AccountPlan';
import CheckingAccount, {
  CheckingAccountType,
} from 'App/Models/CheckingAccount';
import { DailyCashierStatus } from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import Finance, {
  FinanceAccept,
  FinanceOriginFlag,
  FinanceStatus,
  FinanceType,
} from 'App/Models/Finance';
import PaymentMethod, { PaymentMethodTef } from 'App/Models/PaymentMethod';
import TefAcquirer from 'App/Models/TefAcquirer';
import TefFlag, { TefFlagType } from 'App/Models/TefFlag';
import PatientFactory from 'Database/factories/PatientFactory';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Finance resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group, config } = await userBootstrap();

    const tutor = await PatientFactory.create();
    const accountPlan = await AccountPlan.create({
      code: 'some code',
      description: 'some description',
      type: AccountPlanType.C,
      business_unit_id: business.id,
    });

    const checkingAccount = await CheckingAccount.create({
      economic_group_id: business.economicGroupId,
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

    const paymentMethod = await PaymentMethod.create({
      economicGroupId: group.id,
      checkingAccountId: checkingAccount.id,
      tef: PaymentMethodTef.T,
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

    const finance = await Finance.create({
      economic_group_id: group.id,
      business_unit_id: business.id,
      payment_method_id: paymentMethod.id,
      tef_flag_id: tefFlag.id,
      status: FinanceStatus.A,
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

    return {
      user,
      business,
      tutor,
      accountPlan,
      paymentMethod,
      tefAcq,
      tefFlag,
      finance,
      dailyCashier,
      config,
      checkingAccount,
    };
  };

  test('should create finance', async ({ assert, client }) => {
    const { user, accountPlan, tutor, paymentMethod } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/finances/create`)
      .json({
        clientId: tutor.id,
        type: FinanceType.C,
        accountPlanId: accountPlan.id,
        paymentMethodId: paymentMethod.id,
        document: 'some document',
        historic: 'some historic',
        issueDate: new Date(),
        expirationDate: new Date(),
        originalValue: 192,
        accept: FinanceAccept.S,
        installment: 1,
        originFlag: FinanceOriginFlag.C,
        paymentValue: 20,
        competenceDate: '12/2022',
        fiscalNote: 'some note reversal',
        userDocument: '123',
        nsuDocument: '123',
        barCode: '123',
        bank: '123',
        agency: '123',
        account: '123',
        qtyInstallments: 1,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw BadRequestException if no cashier was found (type = usuario)', async ({
    assert,
    client,
  }) => {
    const { user, accountPlan, tutor, paymentMethod, dailyCashier } =
      await createData();
    await dailyCashier.softDelete();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/finances/create`)
      .json({
        clientId: tutor.id,
        type: FinanceType.C,
        accountPlanId: accountPlan.id,
        paymentMethodId: paymentMethod.id,
        document: 'some document',
        historic: 'some historic',
        issueDate: new Date(),
        expirationDate: new Date(),
        originalValue: 192,
        accept: FinanceAccept.S,
        installment: 1,
        originFlag: FinanceOriginFlag.C,
        paymentValue: 20,
        competenceDate: '12/2022',
        fiscalNote: 'some note reversal',
        userDocument: '123',
        nsuDocument: '123',
        barCode: '123',
        bank: '123',
        agency: '123',
        account: '123',
        qtyInstallments: 1,
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should throw BadRequestException if no cashier was found (type = geral)', async ({
    assert,
    client,
  }) => {
    const { user, accountPlan, tutor, paymentMethod, dailyCashier, config } =
      await createData();

    await config.merge({ dailyCashierType: 'geral' }).save();
    await dailyCashier.softDelete();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/finances/create`)
      .json({
        clientId: tutor.id,
        type: FinanceType.C,
        accountPlanId: accountPlan.id,
        paymentMethodId: paymentMethod.id,
        document: 'some document',
        historic: 'some historic',
        issueDate: new Date(),
        expirationDate: new Date(),
        originalValue: 192,
        accept: FinanceAccept.S,
        installment: 1,
        originFlag: FinanceOriginFlag.C,
        paymentValue: 20,
        competenceDate: '12/2022',
        fiscalNote: 'some note reversal',
        userDocument: '123',
        nsuDocument: '123',
        barCode: '123',
        bank: '123',
        agency: '123',
        account: '123',
        qtyInstallments: 1,
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should create finance (with tef related)', async ({
    assert,
    client,
  }) => {
    const { user, accountPlan, tutor, paymentMethod, tefAcq, tefFlag } =
      await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/finances/create`)
      .json({
        clientId: tutor.id,
        type: FinanceType.C,
        accountPlanId: accountPlan.id,
        paymentMethodId: paymentMethod.id,
        document: 'some document',
        historic: 'some historic',
        issueDate: new Date(),
        expirationDate: new Date(),
        originalValue: 192,
        accept: FinanceAccept.S,
        installment: 1,
        originFlag: FinanceOriginFlag.C,
        paymentValue: 20,
        competenceDate: '12/2022',
        fiscalNote: 'some note reversal',
        userDocument: '123',
        nsuDocument: '123',
        barCode: '123',
        bank: '123',
        agency: '123',
        account: '123',
        tefAcquirerId: tefAcq.id,
        tefFlagId: tefFlag.id,
        qtyInstallments: 1,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should search finance', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const qs = new URLSearchParams({
      fromIssueDate: new Date().toISOString(),
      toIssueDate: new Date().toISOString(),

      fromExpirationDate: new Date().toISOString(),
      toExpirationDate: new Date().toISOString(),

      fromPaymentDate: new Date().toISOString(),
      toPaymentDate: new Date().toISOString(),

      id: v4(),
      client: v4(),
      document: v4(),
      fiscalNote: v4(),
      paymentMethod: v4(),
      nsu: v4(),
      status: v4(),
      accept: v4(),
      reconciled: v4(),
      type: v4(),
      unit: v4(),
      plan: v4(),
      competence: v4(),
    });

    const response = await client
      .get(`/finances?${qs.toString()}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should throw BadRequestException if no finance was found when accepting many', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const { finance } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/finances/accept-many`)
      .json({
        ids: [finance.id],
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should accepting many finances', async ({ assert, client }) => {
    const { user, finance } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/finances/accept-many`)
      .json({
        ids: [finance.id],
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should get expiring expenses', async ({ assert, client }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/finances/expiring-expenses`)
      .bearerToken(token);

    // console.log(response.body());

    assert.equal(200, response.status());
  });

  test('should get expiring payments', async ({ assert, client }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/finances/expiring-payments`)
      .bearerToken(token);

    // console.log(response.body());

    assert.equal(200, response.status());
  });

  test('should get checking accounts resume', async ({ assert, client }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/finances/checking-accounts-resume`)
      .bearerToken(token);

    // console.log(response.body());

    assert.equal(200, response.status());
  });

  test('should get open cashiers resume', async ({ assert, client }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/finances/open-cashiers-resume`)
      .bearerToken(token);

    // console.log(response.body());

    assert.equal(200, response.status());
  });

  test('should get closed cashiers resume', async ({ assert, client }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/finances/closed-cashiers-resume`)
      .bearerToken(token);

    // console.log(response.body());

    assert.equal(200, response.status());
  });

  test('should get revised cashiers resume', async ({ assert, client }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/finances/revised-cashiers-resume`)
      .bearerToken(token);

    // console.log(response.body());

    assert.equal(200, response.status());
  });

  test('should do finance down', async ({ assert, client }) => {
    const { user, finance, checkingAccount } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/finances/update-down`)
      .json({
        items: [
          {
            financeId: finance.id,
            checkingAccountId: checkingAccount.id,
            paymentDate: new Date(),
            paymentValue: 100,
            originDownFlag: 'CAIXA_DIARIO',
            feeValue: 100,
            feePercentage: 10,
            discountValue: 10,
            discountPercentage: 1,
            increaseValue: 1,
            increasePercentage: 10,
            competenceDate: '02/2023',
          },
          {
            financeId: finance.id,
            checkingAccountId: checkingAccount.id,
            paymentDate: new Date(),
            paymentValue: 100,
            originDownFlag: 'CAIXA_DIARIO',
            feeValue: 100,
            feePercentage: 10,
            discountValue: 10,
            discountPercentage: 1,
            increaseValue: 1,
            increasePercentage: 10,
            competenceDate: '03/2023',
          },
        ],
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
