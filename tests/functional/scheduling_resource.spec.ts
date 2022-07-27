import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import Schedule from 'App/Models/Schedule';
import WeekDay from 'App/Models/shared/WeekDay';
import User from 'App/Models/User';
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
    const { user, business } = await userBootstrap();

    const status = await ScheduleStatusFactory.create();
    const serviceType = await ScheduleServiceTypeFactory.create();

    return { user, status, serviceType, business };
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
      weekDay: WeekDay.DOMINGO,
      startHour: start,
      endHour: end,
    });
  };

  const createUnavailableDay = async (
    user: User,
    unit: BusinessUnit,
    start: string,
    end: string,
  ) => {
    unit.related('unavailableDays').create({
      id: v4(),
      user_id: user.id,
      startHour: start,
      endHour: end,
    });
  };

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
    await createWorkingDay(
      user,
      business,
      DateTime.now().minus({ hour: 1 }).toString(),
      DateTime.now().minus({ hour: -1 }).toString(),
    );
    await createUnavailableDay(
      user,
      business,
      DateTime.now().minus({ hour: 1 }).toString(),
      DateTime.now().minus({ minutes: 10 }).toString(),
    );

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
      })
      .bearerToken(token);

    const body = result.body();

    assert.equal(400, result.status());
    assert.equal(
      'E_BAD_REQUEST: Usuário não tem esse horário disponível',
      body.message,
    );
  });

  test('should create scheduling', async ({ assert, client }) => {
    const { user, status, serviceType, business } = await createData();
    await createWorkingDay(
      user,
      business,
      DateTime.now().minus({ hour: 1 }).toString(),
      DateTime.now().minus({ hour: -1 }).toString(),
    );

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

  test('should throw BadRequestException for overlapping schedules', async ({
    assert,
    client,
  }) => {
    const { user, status, serviceType, business } = await createData();
    await createWorkingDay(
      user,
      business,
      DateTime.now().minus({ hour: 1 }).toString(),
      DateTime.now().minus({ hour: -1 }).toString(),
    );
    await Schedule.create({
      startHour: DateTime.now(),
      endHour: DateTime.now().minus({ hour: -1 }),
      business_unit_id: business.id,
      user_id: user.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: status.id,
    });

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

    const body = result.body();

    assert.equal(400, result.status());
    assert.equal('E_BAD_REQUEST: Horário já está ocupado', body.message);
  });

  test('should ignore overlapping on request basis', async ({
    assert,
    client,
  }) => {
    const { user, status, serviceType, business } = await createData();
    await createWorkingDay(
      user,
      business,
      DateTime.now().minus({ hour: 1 }).toString(),
      DateTime.now().minus({ hour: -1 }).toString(),
    );
    await Schedule.create({
      startHour: DateTime.now(),
      endHour: DateTime.now().minus({ hour: -1 }),
      business_unit_id: business.id,
      user_id: user.id,
      schedule_service_type_id: serviceType.id,
      schedule_status_id: status.id,
    });

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
        ignoreOverlapping: true,
      })
      .bearerToken(token);

    assert.equal(201, result.status());
  });
});
