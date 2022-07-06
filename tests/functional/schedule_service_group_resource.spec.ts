import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import { LicenceType } from 'App/Models/Licence';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';
import User from 'App/Models/User';
import RoleFactory from 'Database/factories/RoleFactory';
import UserFactory from 'Database/factories/UserFactory';
import { addDays } from 'date-fns';
import { v4 } from 'uuid';

import { createSudo, generateJwtToken } from '../utils';

test.group('Schedule service group resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<
    [User, EconomicGroup, ScheduleServiceGroup, BusinessUnit]
  > => {
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

    const schedule = await ScheduleServiceGroup.create({
      economic_group_id: newGroup.id,
      description: 'some schedule',
    });

    return [user, newGroup, schedule, newBusinessUnit];
  };

  test('should create schedule group service', async ({ assert, client }) => {
    const [user] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/schedule-service-groups')
      .json({
        description: 'some schedule',
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(201, response.status());
    assert.equal('some schedule', body.description);
  });

  test('should return a list of schedule service groups', async ({
    assert,
    client,
  }) => {
    const [user, _, schedule] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get('/schedule-service-groups')
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.isTrue(Boolean(body.find(b => b.id === schedule.id)));
  });

  test('should throw ResourceNotFoundException if no schedule service group was found', async ({
    assert,
    client,
  }) => {
    const [user] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/schedule-service-groups/${v4()}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Recurso não encontrado', body.message);
  });

  test('should return schedule for super admin', async ({ assert, client }) => {
    const [__, _, schedule] = await createData();
    const [user2, ____, _____, businessUnit] = await createData();
    const [sudoRole] = await createSudo();
    await user2.related('roles').create({
      role_id: sudoRole.id,
      unit_id: businessUnit.id,
    });

    const token = await generateJwtToken(client, {
      email: user2.email,
      password: '102030',
    });

    const response = await client
      .get(`/schedule-service-groups/${schedule.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(schedule.id, body.id);
  });
  test('should throw ResourceNotFoundException if no schedule service group was found', async ({
    assert,
    client,
  }) => {
    const [user] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/schedule-service-groups/${v4()}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Recurso não encontrado', body.message);
  });

  test('should return any schedule for super admin', async ({
    assert,
    client,
  }) => {
    const [__, _, schedule] = await createData();
    const [user2, ____, _____, businessUnit] = await createData();
    const [sudoRole] = await createSudo();
    await user2.related('roles').create({
      role_id: sudoRole.id,
      unit_id: businessUnit.id,
    });

    const token = await generateJwtToken(client, {
      email: user2.email,
      password: '102030',
    });

    const response = await client
      .get(`/schedule-service-groups/${schedule.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(schedule.id, body.id);
  });

  test('should return schedule', async ({ assert, client }) => {
    const [user, _, schedule] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/schedule-service-groups/${schedule.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(schedule.id, body.id);
  });
});
