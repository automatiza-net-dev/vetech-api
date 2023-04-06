import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { BusinessUnitProductMetaType } from 'App/Models/BusinessUnitProduct';
import { DailyCashierStatus } from 'App/Models/DailyCashier';
import DailyMovement, { DailyMovementStatus } from 'App/Models/DailyMovement';
import Exam from 'App/Models/Exam';
import { PatientType } from 'App/Models/Patient';
import PatientExam from 'App/Models/PatientExam';
import Product, { ProductType } from 'App/Models/Product';
import Schedule from 'App/Models/Schedule';
import Unit, { UnitType } from 'App/Models/Unit';
import PatientFactory from 'Database/factories/PatientFactory';
import ScheduleServiceTypeFactory from 'Database/factories/ScheduleServiceTypeFactory';
import ScheduleStatusFactory from 'Database/factories/ScheduleStatusFactory';
import { SERVICE_VARIATION_GROUP_ID } from 'Database/seeders/ServiceSeeder';
import { DateTime } from 'luxon';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Patient exam resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const patient = await PatientFactory.create();
    await patient.related('patientAnimal').create({});

    const holder = await PatientFactory.create();
    await holder.merge({ type: PatientType.TUTOR }).save();
    await holder.related('tutor').create({
      state: business.state,
    });

    await holder.related('dependents').attach([patient.id]);
    await group.related('patients').attach([patient.id, holder.id]);

    const client = Database.connection();
    await client
      .from('holder_dependents')
      .where('dependent_id', patient.id)
      .where('holder_id', holder.id)
      .update({ is_main: true });

    const unit = await Unit.create({
      name: 'some name',
      tag: 'some tag',
      type: UnitType.PRODUCT,
    });

    const service = await Product.create({
      description: 'some product',
      type: ProductType.SERVICE,
      referenceCode: 'some reference code',
      features: 'some features',
      unit_id: unit.id,
      active: true,
      economic_group_id: group.id,
      variation_group_id: SERVICE_VARIATION_GROUP_ID,
      icmsOrigin: '0',
      ncm: '00',
    });
    const serviceVariation = await service.related('variations').create({
      barcode: '',
    });
    await serviceVariation.related('businessUnitProducts').create({
      businness_unit_id: business.id,
      price: 10,
      stock: 10,
      maximumStock: 10,
      minimumStock: 10,
      maximumDiscountPercentage: 10,
      commission: 10,
      commissionMeta: 10,
      costPrice: 10,
      maximumDiscountValue: 10,
      meta: 10,
      metaType: BusinessUnitProductMetaType.Quantidade,
      profitMargin: 10,
    });

    // const taxationGroup = await TaxationGroup.create({
    //   name: 'some name',
    //   active: true,
    //   economic_group_id: group.id,
    // });

    const dailyMovement = await DailyMovement.create({
      business_unit_id: business.id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyMovementStatus.A,
    });

    await dailyMovement.related('cashiers').create({
      business_unit_id: dailyMovement.business_unit_id,
      user_who_opened_id: user.id,
      openingDate: DateTime.now(),
      status: DailyCashierStatus.A,
      tag: 1,
    });

    const exam = await Exam.create({
      economic_group_id: group.id,
      type: 'some type',
      name: 'some name',
      description: 'some description',
      ownLaboratory: true,
      product_id: service.id,
    });

    const status = await ScheduleStatusFactory.create();
    const serviceType = await ScheduleServiceTypeFactory.create();
    const schedule = await Schedule.create({
      startHour: DateTime.now().minus({ minute: 1 }),
      endHour: DateTime.now().minus({ hour: -1 }),
      business_unit_id: business.id,
      user_id: user.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: status.id,
    });

    const patientExam = await PatientExam.create({
      realizedAt: DateTime.now(),
      laboratory: 'some lab',
      report: 'some report',
      business_id: business.id,
      exam_id: exam.id,
      patient_id: patient.id,
      schedule_id: schedule.id,
      user_id: user.id,
    });

    return { user, patient, schedule, exam, patientExam, service };
  };

  test('should return list of patient exams', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/patient-exams').bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
  });

  test('should return a patient exam', async ({ client, assert }) => {
    const { user, patientExam } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/patient-exams/${patientExam.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(patientExam.id, body.id);
  });

  test('should create new patient exam', async ({ client, assert }) => {
    const { user, exam, patient, schedule } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/patient-exams')
      .json({
        laboratory: 'some lab',
        report: 'some report',
        examId: exam.id,
        patientId: patient.id,
        scheduleId: schedule.id,
        solicitorId: user.id,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create new patient exam (no schedule)', async ({
    client,
    assert,
  }) => {
    const { user, exam, patient } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/patient-exams')
      .json({
        laboratory: 'some lab',
        report: 'some report',
        examId: exam.id,
        patientId: patient.id,
        solicitorId: user.id,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update patient exam', async ({ client, assert }) => {
    const { user, exam, patient, schedule, patientExam } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/patient-exams/${patientExam.id}`)
      .json({
        laboratory: 'some lab',
        report: 'some report',
        examId: exam.id,
        patientId: patient.id,
        executionerId: user.id,
        executorId: user.id,
        executedAt: new Date(),
        resultDate: new Date(),
        status: 'some status',
        scheduleId: schedule.id,
        releasedAt: new Date(),
      })
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should destroy patient exam', async ({ client, assert }) => {
    const { user, patientExam } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/patient-exams/${patientExam.id}`)

      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
