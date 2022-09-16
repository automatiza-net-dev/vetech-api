import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Exam from 'App/Models/Exam';
import Subgroup from 'App/Models/Subgroup';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Exam resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const subgroup = await Subgroup.create({
      description: 'some group',
      tree: [],
    });

    const exam = await Exam.create({
      name: 'some exam',
      description: 'some description',
      subgroup_id: subgroup.id,
      economic_group_id: group.id,
      ownLaboratory: true,
      type: 'some type',
    });

    return { user, business, subgroup, exam };
  };

  test('should return all exams', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/exams`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create exam', async ({ assert, client }) => {
    const { user, subgroup } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/exams`)
      .json({
        subgroupId: subgroup.id,
        name: 'some name',
        description: 'some description',
        ownLaboratory: true,
        type: 'some type',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw NotFoundException if no exam is found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/exams/${v4()}`).bearerToken(token);

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Exame não encontrada', response.body().message);
  });

  test('should show exam', async ({ assert, client }) => {
    const { user, exam } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/exams/${exam.id}`).bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(exam.id, response.body().id);
  });

  test('should update exam', async ({ assert, client }) => {
    const { user, subgroup, exam } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/exams/${exam.id}`)
      .json({
        subgroupId: subgroup.id,
        name: 'some name',
        description: 'some description',
        active: true,
        ownLaboratory: true,
        type: 'some type',
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(exam.id, response.body().id);
  });

  test('should soft delete exam', async ({ assert, client }) => {
    const { user, exam } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/exams/${exam.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
