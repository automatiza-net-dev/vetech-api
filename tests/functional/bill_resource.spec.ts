import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Bill from 'App/Models/Bill';
import { BillPaymentFeeType } from 'App/Models/BillPayment';
import { DailyCashierStatus } from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import PaymentMethod, { PaymentMethodTef } from 'App/Models/PaymentMethod';
import { ProductType } from 'App/Models/Product';
import TaxationGroup from 'App/Models/TaxationGroup';
import TaxationGroupRule, {
  CompanyType,
  MovementCategory,
  MovementType,
} from 'App/Models/TaxationGroupRule';
import TaxOperation from 'App/Models/TaxOperation';
import TefAcquirer from 'App/Models/TefAcquirer';
import TefFlag, { TefFlagType } from 'App/Models/TefFlag';
import Unit, { UnitType } from 'App/Models/Unit';
import PatientFactory from 'Database/factories/PatientFactory';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Bill resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const patient = await PatientFactory.create();
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
      daily_movement_id: dailyMovement.id,
      daily_cashier_id: dailyCashier.id,
    });

    const payment = await bill.related('payments').create({
      economic_group_id: group.id,
      business_unit_id: business.id,
      block: 1,
      expirationDate: DateTime.now(),
      feeType: BillPaymentFeeType.S,
      feeValue: 0,
      feePercentage: 0,
      installments: 1,
      installmentValue: 10,
      totalValue: 10, // TODO: add fee
    });

    const taxation = await TaxationGroup.create({
      name: 'any name',
      economic_group_id: group.id,
    });

    const operation = await TaxOperation.create({
      code: 'any code',
      description: 'any description',
      movementType: MovementType.E,
      movementCategory: MovementCategory.DE,
      generatesFinancial: true,
      accountingResult: true,
    });

    const rule = await TaxationGroupRule.create({
      companyType: CompanyType.N,
      movementType: MovementType.S,
      movementCategory: MovementCategory.DE,
      fromUf: 'PB',
      toUf: 'PB',
      icmsCst: '00',
      icmsPerc: 10,
      icmsPercRedAliquota: 10,
      icmsPercRedBaseCalculo: 10,
      ivaIcmsSt: 10,
      fcpPerc: 10,
      taxBenefitCode: '10',
      ipiCst: '00',
      ipiPerc: 10,
      pisCst: '01',
      pisPerc: 10,
      cofinsCst: '01',
      cofinsPerc: 10,
      tax_operation_id: operation.id,
      taxation_group_id: taxation.id,
      icmsPercRedBaseCalculoST: 10,
      icmsPercDiferimento: 10,
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

    return {
      user,
      patient,
      dailyMovement,
      dailyCashier,
      bill,
      rule,
      variation,
      paymentMethod,
      tefAcq,
      tefFlag,
      payment,
    };
  };

  test('should search valid taxes', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/bills/taxes`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should search valid products', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/bills/products`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create bill', async ({ assert, client }) => {
    const { user, patient, dailyCashier, dailyMovement } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/bills/create`)
      .json({
        clientId: patient.id,
        patientId: patient.id,
        dailyMovementId: dailyMovement.id,
        dailyCashierId: dailyCashier.id,
        billDate: new Date(),
        productValue: 100,
        serviceValue: 200,
        discountValue: 55,
        items: [],
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create bill item', async ({ assert, client }) => {
    const { user, bill, variation, rule } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/bills/create-item`)
      .json({
        billId: bill.id,
        productVariationId: variation.id,
        taxationGroupRuleId: rule.id,
        quantity: 10,
        costValue: 20,
        saleValue: 20,
        unitaryValue: 20,
        discountValue: 20,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create bill payment', async ({ assert, client }) => {
    const { user, bill, paymentMethod, tefAcq, tefFlag } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/bills/create-payment`)
      .json({
        billId: bill.id,
        paymentMethodId: paymentMethod.id,
        expirationDate: new Date(),
        installments: 1,
        installmentsValue: 10,
        acquirerId: tefAcq.id,
        flagId: tefFlag.id,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create bill payment (no card)', async ({ assert, client }) => {
    const { user, bill, paymentMethod } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/bills/create-payment`)
      .json({
        billId: bill.id,
        paymentMethodId: paymentMethod.id,
        expirationDate: new Date(),
        installments: 1,
        installmentsValue: 10,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should return NotFoundException when deleting invalid bill payment ', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/bills/delete-payment/${v4()}`)

      .bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should return NotFoundException when deleting unauthorized bill payment ', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const { payment } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/bills/delete-payment/${payment.id}`)

      .bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should delete bill payment', async ({ assert, client }) => {
    const { user, payment } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/bills/delete-payment/${payment.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
