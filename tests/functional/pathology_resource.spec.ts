import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import DocumentTemplate from 'App/Models/DocumentTemplate';
import { PATHOLOGY_UUID } from 'App/Models/TimelineType';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Pathology resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group } = await userBootstrap();

    const pathology = await group.related('pathologies').create({
      description: 'any description',
      definition: 'any definition',
      timeline_type_id: PATHOLOGY_UUID,
    });

    const template = await DocumentTemplate.create({
      description: 'any description',
      title: 'any title',
      header: 'any header',
      template: 'any template',
      timeline_type_id: PATHOLOGY_UUID,
    });

    return { user, pathology, template };
  };

  test('should get all pathologies', async ({ client, assert }) => {
    const { user, pathology } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/pathologies').bearerToken(token);
    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(Boolean(body.find(f => f.id === pathology.id)));
  });

  test('should throw ResouceNotFound if no pathology was found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/pathologies/${v4()}`)
      .bearerToken(token);
    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Recurso não encontrado', body.message);
  });

  test('should return given pathology', async ({ client, assert }) => {
    const { user, pathology } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/pathologies/${pathology.id}`)
      .bearerToken(token);
    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(pathology.id, body.id);
  });

  test('should create pathology', async ({ client, assert }) => {
    const { user, template } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/pathologies`)
      .json({
        description: 'any description',
        definition: 'any definition',
        templateId: template.id,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update a pathology', async ({ client, assert }) => {
    const { user, pathology, template } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/pathologies/${pathology.id}`)
      .json({
        description: 'another description',
        definition: 'any definition',
        active: true,
        templateId: template.id,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(pathology.id, body.id);
    assert.notEqual(pathology.description, body.description);
  });

  test('should delete a pathology', async ({ client, assert }) => {
    const { user, pathology } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/pathologies/${pathology.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
