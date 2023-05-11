import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import { PatientType } from 'App/Models/Patient';
import Reason from 'App/Models/Reason';
import Rescheduling from 'App/Models/Rescheduling';
import Schedule from 'App/Models/Schedule';
import {
  SS_ATTENDANCE_CANCELLED,
  SS_CONFIRMED,
  SS_NOT_CONFIRMED,
} from 'App/Models/ScheduleStatus';
import User from 'App/Models/User';
import ScheduleService from 'App/Services/ScheduleService';
import IScheduleContactData from 'Contracts/interfaces/IScheduleContactData';
import IUpdateScheduleStatus from 'Contracts/interfaces/IUpdateScheduleStatus';
import PatientFactory from 'Database/factories/PatientFactory';
import ScheduleServiceTypeFactory from 'Database/factories/ScheduleServiceTypeFactory';
import ScheduleStatusFactory from 'Database/factories/ScheduleStatusFactory';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Scheduling resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, system } = await userBootstrap();

    const status = await ScheduleStatusFactory.create();
    const serviceType = await ScheduleServiceTypeFactory.create();

    const holder = await PatientFactory.create();
    await holder.merge({ type: PatientType.TUTOR }).save();

    const patient = await PatientFactory.create();
    await patient.merge({ type: PatientType.ANIMAL }).save();

    await holder.related('dependents').attach([patient.id]);

    const reason = await Reason.create({
      economicGroupId: business.economicGroupId,
      system_id: system.id,
      reason: 'some',
      type: 'CA',
    });

    return {
      user,
      status,
      serviceType,
      business,
      holder,
      system,
      patient,
      reason,
    };
  };

  const createWorkingDay = async (
    user: User,
    unit: BusinessUnit,
    start: string,
    end: string,
  ) => {
    unit.related('workingDays').create({
      id: v4(),
      user_id: user.id,
      weekDay: ScheduleService.GetWD(new Date()),
      startHour: start,
      endHour: end,
      weekday_index: 0,
    });
  };

  const createUnavailableDay = async (
    user: User,
    unit: BusinessUnit,
    start: string,
    end: string,
    date1: DateTime,
    date2: DateTime,
  ) => {
    unit.related('unavailableDays').create({
      id: v4(),
      user_id: user.id,
      startHour: start,
      endHour: end,
      startDate: date1,
      endDate: date2,
      frequency: [ScheduleService.GetWD(date1.toJSDate())],
    });
  };

  test('should return home content (not confirmed)', async ({
    assert,
    client,
  }) => {
    const { user, serviceType, business, holder } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await Schedule.create({
      patientName: 'any name',
      patientPhone: 'any phone',
      holder_id: holder.id,
      age: 2,
      startHour: DateTime.now(),
      endHour: DateTime.now(),
      majorComplaint: 'some complaint',
      business_unit_id: business.id,
      user_id: user.id,
      patient_id: holder.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: SS_NOT_CONFIRMED,
    });

    const result = await client.get('/schedules/home').bearerToken(token);

    assert.equal(200, result.status());
  });

  test('should return home content (confirmed)', async ({ assert, client }) => {
    const { user, serviceType, business, holder } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await Schedule.create({
      patientName: 'any name',
      patientPhone: 'any phone',
      holder_id: holder.id,
      age: 2,
      startHour: DateTime.now(),
      endHour: DateTime.now(),
      majorComplaint: 'some complaint',
      business_unit_id: business.id,
      user_id: user.id,
      patient_id: holder.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: SS_CONFIRMED,
    });

    const urlParams = new URLSearchParams();
    urlParams.append('confirmed', 'true');

    const result = await client
      .get(`/schedules/home?${urlParams.toString()}`)
      .bearerToken(token);

    assert.equal(200, result.status());
  });

  test('should throw BadRequestException if logged dont have available day', async ({
    assert,
    client,
  }) => {
    const { user, status, serviceType } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .post('/schedules')
      .json({
        scheduleServiceTypeId: serviceType.id,
        scheduleStatusId: status.id,
        startHour: new Date().toISOString(),
        endHour: new Date().toISOString(),
        userId: user.id,
      })
      .bearerToken(token);

    const body = result.body();

    assert.equal(400, result.status());
    assert.equal(
      'E_BAD_REQUEST: Usuário não tem esse horário disponível',
      body.message,
    );
  });

  test('should throw BadRequestException if matches unavailable time', async ({
    assert,
    client,
  }) => {
    const { user, status, serviceType, business } = await createData();
    await createWorkingDay(user, business, '08:00', '10:00');
    await createUnavailableDay(
      user,
      business,
      '08:00',
      '08:50',
      DateTime.now().minus({ day: 1 }),
      DateTime.now().minus({ day: -1 }),
    );

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const d = new Date();

    const result = await client
      .post('/schedules')
      .json({
        scheduleServiceTypeId: serviceType.id,
        scheduleStatusId: status.id,
        startHour: new Date(
          `2022-${d.getMonth() + 1}-${d.getDate()} 08:00:00`,
        ).toISOString(),
        endHour: new Date(
          `2022-${d.getMonth() + 1}-${d.getDate()} 08:50:00`,
        ).toISOString(),
        userId: user.id,
      })
      .bearerToken(token);

    const body = result.body();

    assert.equal(400, result.status());
    assert.equal(
      'E_BAD_REQUEST: Usuário não tem esse horário disponível',
      body.message,
    );
  });

  test('should create scheduling for on duty user', async ({
    assert,
    client,
  }) => {
    const { user, status, serviceType } = await createData();

    await user
      .merge({
        onDuty: true,
      })
      .save();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const d = new Date();

    const result = await client
      .post('/schedules')
      .json({
        scheduleServiceTypeId: serviceType.id,
        scheduleStatusId: status.id,
        startHour: new Date(
          `2022-${d.getMonth() + 1}-${d.getDate()} 08:00:00`,
        ).toISOString(),
        endHour: new Date(
          `2022-${d.getMonth() + 1}-${d.getDate()} 08:50:00`,
        ).toISOString(),
      })
      .bearerToken(token);

    assert.equal(201, result.status());
  });

  test('should create scheduling', async ({ assert, client }) => {
    const { user, status, serviceType, business } = await createData();
    await createWorkingDay(user, business, '00:00', '23:59');

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .post('/schedules')
      .json({
        scheduleServiceTypeId: serviceType.id,
        scheduleStatusId: status.id,
        startHour: new Date(),
        endHour: new Date(),
      })
      .bearerToken(token);

    assert.equal(201, result.status());
  });

  test('should create scheduling with holder', async ({ assert, client }) => {
    const { user, status, serviceType, business, holder } = await createData();
    await createWorkingDay(user, business, '00:00', '23:59');

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .post('/schedules')
      .json({
        scheduleServiceTypeId: serviceType.id,
        scheduleStatusId: status.id,
        startHour: new Date(),
        endHour: new Date(),
        holderId: holder.id,
      })
      .bearerToken(token);

    assert.equal(201, result.status());
  });

  test('should return users with schedule', async ({ assert, client }) => {
    const { user, serviceType, business, holder } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await Schedule.create({
      patientName: 'any name',
      patientPhone: 'any phone',
      holder_id: holder.id,
      age: 2,
      startHour: DateTime.now(),
      endHour: DateTime.now(),
      majorComplaint: 'some complaint',
      business_unit_id: business.id,
      user_id: user.id,
      patient_id: holder.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: SS_NOT_CONFIRMED,
    });

    const result = await client
      .get('/schedules/with-schedule')
      .bearerToken(token);

    assert.equal(200, result.status());
    assert.isArray(result.body());
  });

  test('should return users with schedule and on duty', async ({
    assert,
    client,
  }) => {
    const { user, serviceType, business, holder } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await Schedule.create({
      patientName: 'any name',
      patientPhone: 'any phone',
      holder_id: holder.id,
      age: 2,
      startHour: DateTime.now(),
      endHour: DateTime.now(),
      majorComplaint: 'some complaint',
      business_unit_id: business.id,
      user_id: user.id,
      patient_id: holder.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: SS_NOT_CONFIRMED,
    });

    const qs = new URLSearchParams();
    qs.append('onDuty', '1');

    const result = await client
      .get(`/schedules/with-schedule?${qs.toString()}`)
      .bearerToken(token);

    assert.equal(200, result.status());
    assert.isArray(result.body());
  });

  // TODO enable later
  // test('should throw BadRequestException when cancelling with no reason', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user, serviceType, business, holder } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const schedule = await Schedule.create({
  //     patientName: 'any name',
  //     patientPhone: 'any phone',
  //     holder_id: holder.id,
  //     age: 2,
  //     startHour: DateTime.now(),
  //     endHour: DateTime.now(),
  //     majorComplaint: 'some complaint',
  //     business_unit_id: business.id,
  //     user_id: user.id,
  //     patient_id: holder.id,
  //     schedule_service_type_id: serviceType.id,
  //     schedule_status_id: SS_NOT_CONFIRMED,
  //   });

  //   const result = await client
  //     .put('/schedules/status')
  //     .json({
  //       scheduleId: schedule.id,
  //       statusId: SS_ATTENDANCE_CANCELLED,
  //     } as IUpdateScheduleStatus)
  //     .bearerToken(token);

  //   assert.equal(400, result.status());
  // });

  test('should update status', async ({ assert, client }) => {
    const { user, serviceType, business, holder, system } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const reason = await Reason.create({
      economicGroupId: business.economicGroupId,
      system_id: system.id,
      reason: 'some',
      requiresObservation: true,
    });
    const schedule = await Schedule.create({
      patientName: 'any name',
      patientPhone: 'any phone',
      holder_id: holder.id,
      age: 2,
      startHour: DateTime.now(),
      endHour: DateTime.now(),
      majorComplaint: 'some complaint',
      business_unit_id: business.id,
      user_id: user.id,
      patient_id: holder.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: SS_NOT_CONFIRMED,
    });

    const result = await client
      .put('/schedules/status')
      .json({
        scheduleId: schedule.id,
        statusId: SS_ATTENDANCE_CANCELLED,
        reasonId: reason.id,
        observation: 'some',
      } as IUpdateScheduleStatus)
      .bearerToken(token);

    assert.equal(200, result.status());
  });

  test('should return schedule status changes', async ({ assert, client }) => {
    const { user, serviceType, business, holder, system } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const schedule = await Schedule.create({
      patientName: 'any name',
      patientPhone: 'any phone',
      holder_id: holder.id,
      age: 2,
      startHour: DateTime.now(),
      endHour: DateTime.now(),
      majorComplaint: 'some complaint',
      business_unit_id: business.id,
      user_id: user.id,
      patient_id: holder.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: SS_NOT_CONFIRMED,
    });
    const reason = await Reason.create({
      economicGroupId: business.economicGroupId,
      system_id: system.id,
      reason: 'some',
      requiresObservation: true,
    });
    await schedule.related('statusChanges').create({
      schedule_status_id: SS_ATTENDANCE_CANCELLED,
      user_id: user.id,
      reason_id: reason.id,
      observation: 'some',
    });
    await schedule.related('reschedules').create({
      user_id: user.id,
      reason_id: reason.id,
      observation: 'some',
      originalDate: DateTime.now(),
    });

    const result = await client
      .get(`/schedules/status-changes/${schedule.id}`)
      .bearerToken(token);

    assert.equal(200, result.status());
  });

  test('should create a schedule contact', async ({ assert, client }) => {
    const { user, serviceType, business, holder } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const schedule = await Schedule.create({
      patientName: 'any name',
      patientPhone: 'any phone',
      holder_id: holder.id,
      age: 2,
      startHour: DateTime.now(),
      endHour: DateTime.now(),
      majorComplaint: 'some complaint',
      business_unit_id: business.id,
      user_id: user.id,
      patient_id: holder.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: SS_NOT_CONFIRMED,
    });

    const result = await client
      .post('/schedules/create-contact')
      .json({
        contactDate: DateTime.now(),
        observation: 'some',
        scheduleId: schedule.id,
        statusId: SS_ATTENDANCE_CANCELLED,
      } as IScheduleContactData)
      .bearerToken(token);

    assert.equal(201, result.status());
  });

  test('should return schedule', async ({ assert, client }) => {
    const { user, serviceType, business, holder, system } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const schedule = await Schedule.create({
      patientName: 'any name',
      patientPhone: 'any phone',
      holder_id: holder.id,
      age: 2,
      startHour: DateTime.now(),
      endHour: DateTime.now(),
      majorComplaint: 'some complaint',
      business_unit_id: business.id,
      user_id: user.id,
      patient_id: holder.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: SS_NOT_CONFIRMED,
    });
    const reason = await Reason.create({
      economicGroupId: business.economicGroupId,
      system_id: system.id,
      reason: 'some',
      requiresObservation: true,
    });
    await schedule.related('statusChanges').create({
      schedule_status_id: SS_ATTENDANCE_CANCELLED,
      user_id: user.id,
      reason_id: reason.id,
      observation: 'some',
    });
    await schedule.related('reschedules').create({
      user_id: user.id,
      reason_id: reason.id,
      observation: 'some',
      originalDate: DateTime.now(),
    });
    await schedule.related('contacts').create({
      user_id: user.id,
      observation: 'some',
      contactDate: DateTime.now(),
    });

    const result = await client
      .get(`/schedules/${schedule.id}`)
      .bearerToken(token);

    assert.equal(200, result.status());
  });

  test('should get patient historic', async ({ assert, client }) => {
    const { user, patient, holder, business, serviceType, reason } =
      await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const schedule = await Schedule.create({
      patientName: 'any name',
      patientPhone: 'any phone',
      patient_id: patient.id,
      holder_id: holder.id,
      age: 2,
      startHour: DateTime.now(),
      endHour: DateTime.now(),
      majorComplaint: 'some complaint',
      business_unit_id: business.id,
      user_id: user.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: SS_NOT_CONFIRMED,
      reason_id: reason.id,
      observation: 'some',
      cancellation_user_id: user.id,
    });

    await Rescheduling.create({
      schedule_id: schedule.id,
      user_id: user.id,
      originalDate: DateTime.now(),
      observation: 'some',
      reason_id: reason.id,
    });

    const result = await client
      .get(`/schedules/historic/${patient.id}`)
      .bearerToken(token);

    console.log(JSON.stringify(result.body(), undefined, 2));

    assert.equal(200, result.status());
  });

  // test('should throw BadRequestException for overlapping schedules', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user, status, serviceType, business } = await createData();
  //   await createWorkingDay(user, business, '08:00', '23:00');
  //   await Schedule.create({
  //     startHour: DateTime.now().minus({ minute: 1 }),
  //     endHour: DateTime.now().minus({ hour: -1 }),
  //     business_unit_id: business.id,
  //     user_id: user.id,
  //     schedule_service_type_id: serviceType.id,
  //     schedule_status_id: status.id,
  //   });

  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const result = await client
  //     .post('/schedules')
  //     .json({
  //       scheduleServiceTypeId: serviceType.id,
  //       scheduleStatusId: status.id,
  //       startHour: DateTime.now().toString(),
  //       endHour: DateTime.now().minus({ minute: -50 }).toString(),
  //     })
  //     .bearerToken(token);

  //   const body = result.body();

  //   assert.equal(400, result.status());
  //   assert.equal('E_BAD_REQUEST: Horário já está ocupado', body.message);
  // });

  // test('should ignore overlapping on request basis', async ({
  //   assert,
  //   client,
  // }) => {
  //   const { user, status, serviceType, business } = await createData();
  //   await createWorkingDay(user, business, '08:00', '23:00');
  //   await Schedule.create({
  //     startHour: DateTime.now().minus({ minute: 1 }),
  //     endHour: DateTime.now().minus({ hour: -1 }),
  //     business_unit_id: business.id,
  //     user_id: user.id,
  //     schedule_service_type_id: serviceType.id,
  //     schedule_status_id: status.id,
  //   });

  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const result = await client
  //     .post('/schedules')
  //     .json({
  //       scheduleServiceTypeId: serviceType.id,
  //       scheduleStatusId: status.id,
  //       startHour: DateTime.now().toString(),
  //       endHour: DateTime.now().minus({ minute: -50 }).toString(),
  //       ignoreOverlapping: true,
  //     })
  //     .bearerToken(token);

  //   assert.equal(201, result.status());
  // });
});
