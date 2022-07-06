import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import { LicenceType } from 'App/Models/Licence';
import Schedule from 'App/Models/Schedule';
import WeekDay from 'App/Models/shared/WeekDay';
import User from 'App/Models/User';
import RoleFactory from 'Database/factories/RoleFactory';
import ScheduleServiceTypeFactory from 'Database/factories/ScheduleServiceTypeFactory';
import ScheduleStatusFactory from 'Database/factories/ScheduleStatusFactory';
import UserFactory from 'Database/factories/UserFactory';
import { addDays } from 'date-fns';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { generateJwtToken } from '../utils';

test.group('Scheduling resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const user = await UserFactory.create();

    const newGroup = await user.related('economicGroups').create({
      id: v4(),
      document: user.document,
      responsibleEmail: user.email,
      responsiblePhone: user.phone,
    });

    const newBusinessUnit = await newGroup.related('businessUnits').create({
      id: v4(),
      document: user.document,
      phone: user.phone,
      email: user.email,
      origin: 'TESTING',
    });

    const role = await RoleFactory.create();
    const status = await ScheduleStatusFactory.create();
    const serviceType = await ScheduleServiceTypeFactory.create();

    await user.related('roles').create({
      role_id: role.id,
      unit_id: newBusinessUnit.id,
    });

    await newBusinessUnit.related('licences').create({
      id: v4(),
      active: true,
      expirationDate: addDays(new Date(), 1),
      type: LicenceType.TRIAL,
    });

    return { user, status, serviceType, newBusinessUnit };
  };

  const createWorkingDay = async (
    user: User,
    unit: BusinessUnit,
    start: DateTime,
    end: DateTime,
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
    start: DateTime,
    end: DateTime,
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
    const { user, status, serviceType, newBusinessUnit } = await createData();
    await createWorkingDay(
      user,
      newBusinessUnit,
      DateTime.now().minus({ hour: 1 }),
      DateTime.now().minus({ hour: -1 }),
    );
    await createUnavailableDay(
      user,
      newBusinessUnit,
      DateTime.now().minus({ hour: 1 }),
      DateTime.now().minus({ minutes: 10 }),
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
    const { user, status, serviceType, newBusinessUnit } = await createData();
    await createWorkingDay(
      user,
      newBusinessUnit,
      DateTime.now().minus({ hour: 1 }),
      DateTime.now().minus({ hour: -1 }),
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
    const { user, status, serviceType, newBusinessUnit } = await createData();
    await createWorkingDay(
      user,
      newBusinessUnit,
      DateTime.now().minus({ hour: 1 }),
      DateTime.now().minus({ hour: -1 }),
    );
    await Schedule.create({
      startHour: DateTime.now(),
      endHour: DateTime.now().minus({ hour: -1 }),
      business_unit_id: newBusinessUnit.id,
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
});
