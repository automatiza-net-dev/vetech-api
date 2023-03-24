import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Bill, { BillStatus } from 'App/Models/Bill';
import BusinessUnitFiscalDocument from 'App/Models/BusinessUnitFiscalDocument';
import { DailyCashierStatus } from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import FiscalDocument, {
  FiscalDocumentMovementType,
  FiscalDocumentType,
} from 'App/Models/FiscalDocument';
import { DateTime } from 'luxon';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Business unit fiscal document resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group: eGroup, business } = await userBootstrap();

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
      economic_group_id: eGroup.id,
      business_unit_id: business.id,
      user_id: user.id,
      seller_id: user.id,
      daily_movement_id: dailyMovement.id,
      daily_cashier_id: dailyCashier.id,
      status: BillStatus.A,
    });

    const fiscalDocument = await FiscalDocument.create({
      description: 'some description',
      model: 'some model',
      documentType: FiscalDocumentType.P,
      movementType: FiscalDocumentMovementType.A,
      active: true,
    });

    const unitFiscalDocument = await BusinessUnitFiscalDocument.create({
      economic_group_id: eGroup.id,
      business_unit_id: business.id,

      documentType: FiscalDocumentType.P,
      movementType: FiscalDocumentMovementType.A,
      description: 'some description',
      model: 'some model',
      series: 'some series',
      sequence: 1,
    });

    return {
      user,
      bill,
      unitFiscalDocument,
      eGroup,
      business,
      fiscalDocument,
    };
  };

  test('should create business unit fiscal document', async ({
    assert,
    client,
  }) => {
    const { user, fiscalDocument } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/fiscal-documents/business-unit/store`)
      .json({
        fiscalDocumentId: fiscalDocument.id,
        type: FiscalDocumentType.P,
        movement: FiscalDocumentMovementType.A,
        description: 'some description',
        model: 'some model',
        series: 'some series 1',
        sequence: 1,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  // test('should throw BadRequestException if authorized already issued document', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user, eGroup, unitFiscalDocument, bill, business } =
  //     await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   await IssuedFiscalDocument.create({
  //     economic_group_id: eGroup.id,
  //     business_unit_id: business.id,
  //     bill_id: bill.id,
  //     movementType: BusinessUnitFiscalDocumentMovementType.E,
  //     // fiscal document id,
  //     model: 'some model',
  //     series: 'some series',
  //     sequence: 1,
  //     accessKeyRef: 'some access key ref',
  //     user_who_authorized_id: user.id,
  //     authorizationDate: DateTime.now(),
  //     contingency: IssuedFiscalDocumentContingency.N,
  //     active: true,
  //   });

  //   const response = await client
  //     .post(`/fiscal-documents/business-unit/authorize`)
  //     .json({
  //       billId: bill.id,
  //       unitFiscalDocumentId: unitFiscalDocument.id,
  //       type: BusinessUnitFiscalDocumentMovementType.E,
  //       accessKeyRef: 'some',
  //     })
  //     .bearerToken(token);

  //   assert.equal(400, response.status());
  // });

  // test('should authorized issued document', async ({ assert, client }) => {
  //   const { user, unitFiscalDocument, bill } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const response = await client
  //     .post(`/fiscal-documents/business-unit/authorize`)
  //     .json({
  //       billId: bill.id,
  //       unitFiscalDocumentId: unitFiscalDocument.id,
  //       type: BusinessUnitFiscalDocumentMovementType.E,
  //       accessKeyRef: 'some',
  //     })
  //     .bearerToken(token);

  //   assert.equal(201, response.status());
  // });

  // test('should throw ResourceNotFound for invalid document', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user: validUser, bill, eGroup, business } = await createData();
  //   const { user } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const issuedDocument = await IssuedFiscalDocument.create({
  //     economic_group_id: eGroup.id,
  //     business_unit_id: business.id,
  //     bill_id: bill.id,
  //     movementType: BusinessUnitFiscalDocumentMovementType.E,
  //     // fiscal document id,
  //     model: 'some model',
  //     series: 'some series',
  //     sequence: 1,
  //     accessKeyRef: 'some access key ref',
  //     user_who_authorized_id: validUser.id,
  //     authorizationDate: DateTime.now(),
  //     contingency: IssuedFiscalDocumentContingency.N,
  //     active: true,
  //   });

  //   const response = await client
  //     .post(`/fiscal-documents/business-unit/cancel`)
  //     .json({
  //       issuedDocumentId: issuedDocument.id,
  //       reason: 'some',
  //     })
  //     .bearerToken(token);

  //   assert.equal(404, response.status());
  // });

  // test('should throw BadRequestException for invalid state of document when cancelling', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user, bill, eGroup, business } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const issuedDocument = await IssuedFiscalDocument.create({
  //     economic_group_id: eGroup.id,
  //     business_unit_id: business.id,
  //     bill_id: bill.id,
  //     movementType: BusinessUnitFiscalDocumentMovementType.E,
  //     // fiscal document id,
  //     model: 'some model',
  //     series: 'some series',
  //     sequence: 1,
  //     accessKeyRef: 'some access key ref',
  //     user_who_authorized_id: user.id,
  //     authorizationDate: DateTime.now(),
  //     contingency: IssuedFiscalDocumentContingency.N,
  //     active: true,
  //   });

  //   const response = await client
  //     .post(`/fiscal-documents/business-unit/cancel`)
  //     .json({
  //       issuedDocumentId: issuedDocument.id,
  //       reason: 'some',
  //     })
  //     .bearerToken(token);

  //   assert.equal(400, response.status());
  // });

  // test('should cancel issued document', async ({ assert, client }) => {
  //   const { user, bill, eGroup, business } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const issuedDocument = await IssuedFiscalDocument.create({
  //     economic_group_id: eGroup.id,
  //     business_unit_id: business.id,
  //     bill_id: bill.id,
  //     movementType: BusinessUnitFiscalDocumentMovementType.E,
  //     // fiscal document id,
  //     model: 'some model',
  //     series: 'some series',
  //     sequence: 1,
  //     accessKeyRef: 'some access key ref',
  //     user_who_authorized_id: user.id,
  //     authorizationDate: DateTime.now(),
  //     contingency: IssuedFiscalDocumentContingency.N,
  //     active: true,
  //     accessKey: 'some key',
  //     authorizationReceipt: 'some receipt',
  //   });

  //   const response = await client
  //     .post(`/fiscal-documents/business-unit/cancel`)
  //     .json({
  //       issuedDocumentId: issuedDocument.id,
  //       reason: 'some',
  //     })
  //     .bearerToken(token);

  //   assert.equal(204, response.status());
  // });

  // test('should throw BadRequestException for invalid state of document when disabling', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user, bill, eGroup, business } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const issuedDocument = await IssuedFiscalDocument.create({
  //     economic_group_id: eGroup.id,
  //     business_unit_id: business.id,
  //     bill_id: bill.id,
  //     movementType: BusinessUnitFiscalDocumentMovementType.E,
  //     // fiscal document id,
  //     model: 'some model',
  //     series: 'some series',
  //     sequence: 1,
  //     accessKeyRef: 'some access key ref',
  //     user_who_authorized_id: user.id,
  //     contingency: IssuedFiscalDocumentContingency.N,
  //     active: true,
  //   });

  //   const response = await client
  //     .post(`/fiscal-documents/business-unit/disable`)
  //     .json({
  //       issuedDocumentId: issuedDocument.id,
  //       reason: 'some',
  //     })
  //     .bearerToken(token);

  //   assert.equal(400, response.status());
  // });

  // test('should disable issued document', async ({ assert, client }) => {
  //   const { user, bill, eGroup, business } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const issuedDocument = await IssuedFiscalDocument.create({
  //     economic_group_id: eGroup.id,
  //     business_unit_id: business.id,
  //     bill_id: bill.id,
  //     movementType: BusinessUnitFiscalDocumentMovementType.E,
  //     // fiscal document id,
  //     model: 'some model',
  //     series: 'some series',
  //     sequence: 1,
  //     accessKeyRef: 'some access key ref',
  //     user_who_authorized_id: user.id,
  //     contingency: IssuedFiscalDocumentContingency.N,
  //     active: true,
  //     accessKey: 'some key',
  //     authorizationReceipt: 'some receipt',
  //     authorizationDate: DateTime.now(),
  //   });

  //   const response = await client
  //     .post(`/fiscal-documents/business-unit/cancel`)
  //     .json({
  //       issuedDocumentId: issuedDocument.id,
  //       reason: 'some',
  //     })
  //     .bearerToken(token);

  //   assert.equal(204, response.status());
  // });

  // test('should throw BadRequestException for invalid state of document when correcting', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user, bill, eGroup, business } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const issuedDocument = await IssuedFiscalDocument.create({
  //     economic_group_id: eGroup.id,
  //     business_unit_id: business.id,
  //     bill_id: bill.id,
  //     movementType: BusinessUnitFiscalDocumentMovementType.E,
  //     // fiscal document id,
  //     model: 'some model',
  //     series: 'some series',
  //     sequence: 1,
  //     accessKeyRef: 'some access key ref',
  //     user_who_authorized_id: user.id,
  //     contingency: IssuedFiscalDocumentContingency.N,
  //     active: true,
  //   });

  //   const response = await client
  //     .post(`/fiscal-documents/business-unit/correct`)
  //     .json({
  //       issuedDocumentId: issuedDocument.id,
  //       reason: 'some',
  //     })
  //     .bearerToken(token);

  //   assert.equal(400, response.status());
  // });

  // TODO correct this
  // test('should correct issued document', async ({ assert, client }) => {
  //   const { user, bill, eGroup, business } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const issuedDocument = await IssuedFiscalDocument.create({
  //     economic_group_id: eGroup.id,
  //     business_unit_id: business.id,
  //     bill_id: bill.id,
  //     movementType: BusinessUnitFiscalDocumentMovementType.E,
  //     // fiscal document id,
  //     model: 'some model',
  //     series: 'some series',
  //     sequence: 1,
  //     accessKeyRef: 'some access key ref',
  //     user_who_authorized_id: user.id,
  //     contingency: IssuedFiscalDocumentContingency.N,
  //     active: true,
  //     accessKey: 'some key',
  //     authorizationReceipt: 'some receipt',
  //     authorizationReceiptDate: DateTime.now(),
  //   });

  //   const response = await client
  //     .post(`/fiscal-documents/business-unit/correct`)
  //     .json({
  //       issuedDocumentId: issuedDocument.id,
  //       reason: 'some',
  //     })
  //     .bearerToken(token);

  //   assert.equal(204, response.status());
  // });

  // test('should return index with clean up', async ({ assert, client }) => {
  //   const { user } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const response = await client
  //     .get(`/fiscal-documents/business-unit/search`)
  //     .bearerToken(token);

  //   assert.equal(200, response.status());
  // });

  // test('should return index with params', async ({ assert, client }) => {
  //   const { user, business, bill } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const params = new URLSearchParams({
  //     unit: business.id,
  //     type: BusinessUnitFiscalDocumentMovementType.E,
  //     bill: bill.id,
  //     active: 'true',
  //     document: v4(),
  //   });

  //   const response = await client
  //     .get(`/fiscal-documents/business-unit/search?${params.toString()}`)
  //     .bearerToken(token);

  //   assert.equal(200, response.status());
  // });
});
