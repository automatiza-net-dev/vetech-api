import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { DOCUMENT_UUID } from 'App/Models/TimelineType';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Document template resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, system } = await userBootstrap();

    const template = await group.related('documentTemplates').create({
      description: 'any description',
      title: 'any title',
      template: 'any template',
      timeline_type_id: DOCUMENT_UUID,
      system_id: system.id,
    });

    return { user, template };
  };

  test('should get all document templates', async ({ client, assert }) => {
    const { user, template } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/document-templates').bearerToken(token);
    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(Boolean(body.find(f => f.id === template.id)));
  });

  test('should throw ResouceNotFound if no document was found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/document-templates/${v4()}`)
      .bearerToken(token);
    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Recurso não encontrado', body.message);
  });

  test('should return given document', async ({ client, assert }) => {
    const { user, template } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/document-templates/${template.id}`)
      .bearerToken(token);
    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(template.id, body.id);
  });

  test('should create a new document template', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/document-templates`)
      .json({
        description: 'some description',
        title: 'some title',
        header: 'some header',
        template: 'some template',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update a document template', async ({ client, assert }) => {
    const { user, template } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/document-templates/${template.id}`)
      .json({
        description: 'some description',
        title: 'another title',
        template: 'some template',
        active: true,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(template.id, body.id);
    assert.notEqual(template.title, body.title);
  });

  test('should delete a document template', async ({ client, assert }) => {
    const { user, template } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/document-templates/${template.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
