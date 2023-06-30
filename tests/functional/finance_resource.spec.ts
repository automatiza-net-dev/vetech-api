import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import AccountPlan, { AccountPlanType } from 'App/Models/AccountPlan';
import Finance, {
  FinanceAccept,
  FinanceOriginFlag,
  FinanceType,
} from 'App/Models/Finance';
import PaymentMethod, { PaymentMethodTef } from 'App/Models/PaymentMethod';
import TefAcquirer from 'App/Models/TefAcquirer';
import TefFlag, { TefFlagType } from 'App/Models/TefFlag';
import PatientFactory from 'Database/factories/PatientFactory';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Finance resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const tutor = await PatientFactory.create();
    const accountPlan = await AccountPlan.create({
      code: 'some code',
      description: 'some description',
      type: AccountPlanType.C,
      business_unit_id: business.id,
    });
    const paymentMethod = await PaymentMethod.create({
      economicGroupId: group.id,
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
      })
      .bearerToken(token);

    assert.equal(201, response.status());
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

    const qs = new URLSearchParams();
    qs.append('type', 'DEBITO');
    qs.append('order', 'doc');
    qs.append('fromIssue', '2023-05-29T03:00:00.000Z');
    qs.append('toIssue', '2023-06-01T02:59:59.999Z');

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
});
