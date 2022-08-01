import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Attendances resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business } = await userBootstrap();

    const status = await business.related('attendanceStatuses').create({
      description: 'some description',
      color: 'some color',
    });

    const schedule = await user.related('schedules').create({
      business_unit_id: business.id,
    });

    const attendance = await schedule.related('attendances').create({
      startDate: new Date(),
      endDate: new Date(),
      complaint: 'some complaint',
      business_unit_id: business.id,
      attendance_status_id: status.id,
      clinicalExamination: 'some data',
    });

    return { user, status, attendance, schedule };
  };

  test('should get all attendances', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client.get('/attendances').bearerToken(token);

    // const body = result.body();

    assert.equal(200, result.status());
    // TODO test is paginated
  });

  test('should throw ResourceNotFoundException for invalid status', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client.get(`/attendances/${v4()}`).bearerToken(token);

    const body = result.body();

    assert.equal(404, result.status());
    assert.equal('E_NOT_FOUND: Recurso não encontrado', body.message);
  });

  test('should return valid attendance', async ({ assert, client }) => {
    const { user, attendance } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .get(`/attendances/${attendance.id}`)
      .bearerToken(token);

    const body = result.body();

    assert.equal(200, result.status());
    assert.equal(attendance.id, body.id);
  });

  test('should create a attendance', async ({ assert, client }) => {
    const { user, schedule, status } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .post('/attendances')
      .json({
        schedule: schedule.id,
        status: status.id,
        complaint: 'some complaint',
        clinicalExamination: 'something',
        startDate: '2022-07-21',
        endDate: '2022-07-21',
      })
      .bearerToken(token);

    assert.equal(201, result.status());
  });

  test('should update a attendance', async ({ assert, client }) => {
    const { user, schedule, status, attendance } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .put(`/attendances/${attendance.id}`)
      .json({
        schedule: schedule.id,
        status: status.id,
        complaint: 'different complaint',
        clinicalExamination: 'something',
        startDate: '2022-07-21',
        endDate: '2022-07-21',
      })
      .bearerToken(token);

    const body = result.body();

    assert.equal(200, result.status());
    assert.notEqual(attendance.complaint, body.complaint);
  });

  test('should soft delete status', async ({ assert, client }) => {
    const { user, attendance } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .delete(`/attendances/${attendance.id}`)
      .bearerToken(token);

    assert.equal(204, result.status());
  });
});
