import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Occurrence, { OccurrenceType } from 'App/Models/Occurrence';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Occurrences resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group } = await userBootstrap();

    const occurence = await Occurrence.create({
      description: 'any description',
      type: OccurrenceType.ADMISSAO_INTERNACAO,
      economic_group_id: group.id,
    });

    return { user, occurence };
  };

  test('should get all occurrences', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/occurrences').bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should create occurrence', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/occurrences`)
      .json({
        description: 'any description',
        type: OccurrenceType.ADMISSAO_INTERNACAO,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw ResouceNotFound if no occurence was found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/occurrences/${v4()}`)
      .bearerToken(token);
    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Recurso não encontrado', body.message);
  });

  test('should return given occurence', async ({ client, assert }) => {
    const { user, occurence } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/occurrences/${occurence.id}`)
      .bearerToken(token);
    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(occurence.id, body.id);
  });

  test('should update a occurence', async ({ client, assert }) => {
    const { user, occurence } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/occurrences/${occurence.id}`)
      .json({
        description: 'another description',
        type: OccurrenceType.ADMISSAO_INTERNACAO,
        active: true,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(occurence.id, body.id);
    assert.notEqual(occurence.description, body.description);
  });

  test('should delete a occurence', async ({ client, assert }) => {
    const { user, occurence } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/occurrences/${occurence.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
