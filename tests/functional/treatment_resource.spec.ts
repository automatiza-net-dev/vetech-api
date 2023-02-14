import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { PatientType } from 'App/Models/Patient';
import Schedule from 'App/Models/Schedule';
import ScheduleServiceGroup, {
  ScheduleServiceGroupType,
} from 'App/Models/ScheduleServiceGroup';
import { SS_NOT_CONFIRMED } from 'App/Models/ScheduleStatus';
import Treatment from 'App/Models/Treatment';
import PatientFactory from 'Database/factories/PatientFactory';
import ScheduleServiceTypeFactory from 'Database/factories/ScheduleServiceTypeFactory';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Treatment resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business } = await userBootstrap();

    const scheduleServiceGroup = await ScheduleServiceGroup.create({
      economic_group_id: group.id,
      description: 'some schedule',
      type: ScheduleServiceGroupType.R,
    });

    const scheduleServiceType = await scheduleServiceGroup
      .related('types')
      .create({
        id: v4(),
        economic_group_id: group.id,
        description: 'some schedule',
        reservedMinutes: 90,
        allowReturn: true,
        resume: 'some resume',
      });

    const treatment = await Treatment.create({
      business_unit_id: business.id,
      open_user_id: user.id,
      schedule_service_id: scheduleServiceType.id,
      resume: 'some resume',
      protocol: 'some protocol',
      startDate: DateTime.now(),
    });

    const patient = await PatientFactory.create();
    const holder = await PatientFactory.create();
    await holder.merge({ type: PatientType.TUTOR }).save();
    await holder.related('dependents').attach([patient.id]);

    const client = Database.connection();
    await client
      .from('holder_dependents')
      .where('dependent_id', patient.id)
      .where('holder_id', holder.id)
      .update({ is_main: true });

    const serviceType = await ScheduleServiceTypeFactory.create();
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
      patient_id: patient.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: SS_NOT_CONFIRMED,
    });

    return {
      user,
      group,
      business,
      treatment,
      scheduleServiceType,
      schedule,
      holder,
      patient,
    };
  };

  test('should return all treatments', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/treatments`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should throw BadRequestException is no schedule or patient is sent when creating treatment', async ({
    assert,
    client,
  }) => {
    const { user, scheduleServiceType } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/treatments/open`)
      .json({
        scheduleServiceId: scheduleServiceType.id,
        resume: 'some resume',
        protocol: 'some protocol',
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should open treatment (with schedule)', async ({ assert, client }) => {
    const { user, scheduleServiceType, schedule } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/treatments/open`)
      .json({
        scheduleServiceId: scheduleServiceType.id,
        scheduleId: schedule.id,
        resume: 'some resume',
        protocol: 'some protocol',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should open treatment (with patient only)', async ({
    assert,
    client,
  }) => {
    const { user, scheduleServiceType, patient } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/treatments/open`)
      .json({
        scheduleServiceId: scheduleServiceType.id,
        patientId: patient.id,
        resume: 'some resume',
        protocol: 'some protocol',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw NotFoundException if no treatment was found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/treatments/show/${-1}`)
      .bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should return treatment when found', async ({ assert, client }) => {
    const { user, treatment } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/treatments/show/${treatment.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should update treatment', async ({ assert, client }) => {
    const { user, treatment } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/treatments/update/${treatment.id}`)
      .json({
        resume: 'some new resume',
        protocol: 'some new protocol',
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should close treatment', async ({ assert, client }) => {
    const { user, treatment } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/treatments/close/${treatment.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should throw BadRequestException is treatment is already closed', async ({
    assert,
    client,
  }) => {
    const { user, treatment } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await treatment
      .merge({ endDate: DateTime.now(), close_user_id: user.id })
      .save();

    const response = await client
      .put(`/treatments/close/${treatment.id}`)
      .bearerToken(token);

    assert.equal(400, response.status());
  });
});
