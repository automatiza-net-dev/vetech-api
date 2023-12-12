import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import AccountPlan from 'App/Models/AccountPlan';
import AccountPlanGroup, {
  AccountPlanGroupType,
} from 'App/Models/AccountPlanGroup';
import Banking, {
  BankingOriginFlag,
  BankingStatus,
  BankingType,
} from 'App/Models/Banking';
import CheckingAccount, {
  CheckingAccountType,
} from 'App/Models/CheckingAccount';
import { DailyCashierStatus } from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import PaymentMethod, {
  PaymentMethodTef,
  PaymentMethodType,
} from 'App/Models/PaymentMethod';
import PatientFactory from 'Database/factories/PatientFactory';
import { DateTime } from 'luxon';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Banking resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, config } = await userBootstrap();

    const apg = await AccountPlanGroup.create({
      economic_group_id: business.economicGroupId,
      description: 'some description',
      type: AccountPlanGroupType.A,
    });

    const ap = await AccountPlan.create({
      business_unit_id: business.id,
      description: 'some description',
      code: 'some code',
      account_plan_group_id: apg.id,
    });

    const paymentMethod = await PaymentMethod.create({
      economicGroupId: business.economicGroupId,
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

    const patient = await PatientFactory.create();

    await Banking.create({
      economic_group_id: business.economicGroupId,
      business_unit_id: business.id,
      client_id: patient.id,
      account_plan_id: ap.id,
      payment_method_id: paymentMethod.id,
      checking_account_id: checkingAccount.id,

      type: BankingType.C,
      document: 'some',
      historic: 'some',
      issueDate: DateTime.now(),
      documentValue: 1,
      feeValue: 1,
      feePercentage: 1,
      discountValue: 1,
      discountPercentage: 1,
      reconciled: true,
      installment: 1,
      originFlag: BankingOriginFlag.B,

      totalValue: 10,
      status: BankingStatus.B,
      prevBalance: 0,
      balance: 10,
      paymentMethodDiscountPercentage: paymentMethod.fee,
      paymentMethodDiscountValue: 0,
      competenceDate: '03/2023',
      fiscalNote: 'some',
      userDocument: 'some',
      nsuDocument: 'some',
      barCode: 'some',
    });

    await Banking.create({
      economic_group_id: business.economicGroupId,
      business_unit_id: business.id,
      client_id: patient.id,
      account_plan_id: ap.id,
      payment_method_id: paymentMethod.id,
      checking_account_id: checkingAccount.id,

      type: BankingType.C,
      document: 'some',
      historic: 'some',
      issueDate: DateTime.now(),
      documentValue: 2,
      feeValue: 2,
      feePercentage: 2,
      discountValue: 2,
      discountPercentage: 2,
      reconciled: true,
      installment: 2,
      originFlag: BankingOriginFlag.B,

      totalValue: 20,
      status: BankingStatus.B,
      prevBalance: 0,
      balance: 20,
      paymentMethodDiscountPercentage: paymentMethod.fee,
      paymentMethodDiscountValue: 0,
      competenceDate: '03/2023',
      fiscalNote: 'some',
      userDocument: 'some',
      nsuDocument: 'some',
      barCode: 'some',
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
      ap,
      paymentMethod,
      checkingAccount,
      patient,
      config,
      dailyCashier,
    };
  };

  test('should create banking', async ({ assert, client }) => {
    const props = await createData();
    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .post(`/bankings/create`)
      .json({
        clientId: props.patient.id,
        type: BankingType.C,
        accountPlanId: props.ap.id,
        paymentMethodId: props.paymentMethod.id,
        checkingAccountId: props.checkingAccount.id,
        document: 'some',
        historic: 'some',
        issueDate: DateTime.now().minus({ hour: 1 }),
        documentValue: 1,
        feeValue: 1,
        feePercentage: 1,
        discountValue: 1,
        discountPercentage: 1,
        reconciled: true,
        installment: 1,
        originFlag: BankingOriginFlag.B,
      })
      .bearerToken(token);

    // console.log(response.body());

    assert.equal(201, response.status());
  });

  test('should throw BadRequestException if no daily cashier (type = usuario)', async ({
    assert,
    client,
  }) => {
    const props = await createData();
    await props.dailyCashier.softDelete();

    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .post(`/bankings/create`)
      .json({
        clientId: props.patient.id,
        type: BankingType.C,
        accountPlanId: props.ap.id,
        paymentMethodId: props.paymentMethod.id,
        checkingAccountId: props.checkingAccount.id,
        document: 'some',
        historic: 'some',
        issueDate: DateTime.now().minus({ hour: 1 }),
        documentValue: 1,
        feeValue: 1,
        feePercentage: 1,
        discountValue: 1,
        discountPercentage: 1,
        reconciled: true,
        installment: 1,
        originFlag: BankingOriginFlag.B,
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should throw BadRequestException if no daily cashier (type = geral)', async ({
    assert,
    client,
  }) => {
    const props = await createData();

    await props.config.merge({ dailyCashierType: 'geral' }).save();
    await props.dailyCashier.softDelete();

    const token = await generateJwtToken(client, {
      email: props.user.email,
      password: '102030',
    });

    const response = await client
      .post(`/bankings/create`)
      .json({
        clientId: props.patient.id,
        type: BankingType.C,
        accountPlanId: props.ap.id,
        paymentMethodId: props.paymentMethod.id,
        checkingAccountId: props.checkingAccount.id,
        document: 'some',
        historic: 'some',
        issueDate: DateTime.now().minus({ hour: 1 }),
        documentValue: 1,
        feeValue: 1,
        feePercentage: 1,
        discountValue: 1,
        discountPercentage: 1,
        reconciled: true,
        installment: 1,
        originFlag: BankingOriginFlag.B,
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });
});
