import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import ScheduleServiceGroup, {
  ScheduleServiceGroupType,
} from 'App/Models/ScheduleServiceGroup';
import User from 'App/Models/User';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Schedule service group resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<
    [User, EconomicGroup, ScheduleServiceGroup, BusinessUnit]
  > => {
    const { user, group, business, system } = await userBootstrap();

    const schedule = await ScheduleServiceGroup.create({
      economic_group_id: group.id,
      description: 'some schedule',
      system_id: system.id,
    });

    return [user, group, schedule, business];
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
        type: ScheduleServiceGroupType.R,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(201, response.status());
    assert.equal('some schedule', body.description);
  });

  test('should create schedule group service 2', async ({ assert, client }) => {
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
