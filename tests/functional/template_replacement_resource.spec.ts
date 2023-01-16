import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import TemplateReplacement, {
  TemplateReplacementOrigin,
} from 'App/Models/TemplateReplacement';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Template replacement resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group: ecoGroup } = await userBootstrap();

    const template = await TemplateReplacement.create({
      economic_group_id: ecoGroup.id,
      origin: TemplateReplacementOrigin.PATIENTS,
      attribute: 'SOME',
      replacer: '[[SOME_1]]',
    });

    return { user, template };
  };

  test('should return all template replacements', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/template-replacements`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create template replacement', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/template-replacements/create`)
      .json({
        origin: TemplateReplacementOrigin.PATIENTS,
        attribute: 'SOME',
        replacer: '[[SOME]]',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update template replacement', async ({ assert, client }) => {
    const { user, template } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/template-replacements/update/${template.id}`)
      .json({
        origin: TemplateReplacementOrigin.PATIENTS,
        attribute: template.attribute,
        replacer: template.replacer,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should delete template replacement', async ({ assert, client }) => {
    const { user, template } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/template-replacements/delete/${template.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
