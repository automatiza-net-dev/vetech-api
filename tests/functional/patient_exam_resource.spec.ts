import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Exam from 'App/Models/Exam';
import PatientExam from 'App/Models/PatientExam';
import Schedule from 'App/Models/Schedule';
import PatientFactory from 'Database/factories/PatientFactory';
import ScheduleServiceTypeFactory from 'Database/factories/ScheduleServiceTypeFactory';
import ScheduleStatusFactory from 'Database/factories/ScheduleStatusFactory';
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

    const exam = await Exam.create({
      economic_group_id: group.id,
      type: 'some type',
      name: 'some name',
      description: 'some description',
      ownLaboratory: true,
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

    return { user, patient, schedule, exam, patientExam };
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
