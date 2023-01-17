import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Schedule from 'App/Models/Schedule';
import TemplateReplacement, {
  TemplateReplacementOrigin,
} from 'App/Models/TemplateReplacement';
import PatientFactory from 'Database/factories/PatientFactory';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Template replacement resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group: ecoGroup, business } = await userBootstrap();

    const template = await TemplateReplacement.create({
      economic_group_id: ecoGroup.id,
      origin: TemplateReplacementOrigin.BUSINESS,
      attribute: 'SOME',
      replacer: '[[SOME_1]]',
    });

    const tutor = await PatientFactory.create();
    const patient = await PatientFactory.create();

    const schedule = await Schedule.create({
      business_unit_id: business.id,
      patientName: patient.name,
    });

    return { user, template, ecoGroup, business, tutor, patient, schedule };
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
        origin: TemplateReplacementOrigin.BUSINESS,
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
        origin: TemplateReplacementOrigin.BUSINESS,
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

  test('should replace text with no info', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/template-replacements/replace-text`)
      .json({
        base: `TEXT`,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(`TEXT`, response.body().result);
  });

  test('should replace text with business text', async ({ assert, client }) => {
    const { user, ecoGroup, business } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const businessTemplate = await TemplateReplacement.create({
      economic_group_id: ecoGroup.id,
      origin: TemplateReplacementOrigin.BUSINESS,
      attribute: 'document',
      replacer: '[[DOCUMENT]]',
    });

    const response = await client
      .post(`/template-replacements/replace-text`)
      .json({
        base: businessTemplate.replacer,
        businessUnitId: business.id,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(business.document, response.body().result);
  });

  test('should replace text with user text', async ({ assert, client }) => {
    const { user, ecoGroup } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const userTemplate = await TemplateReplacement.create({
      economic_group_id: ecoGroup.id,
      origin: TemplateReplacementOrigin.USER,
      attribute: 'name',
      replacer: '[[NAME]]',
    });

    const response = await client
      .post(`/template-replacements/replace-text`)
      .json({
        base: userTemplate.replacer,
        userId: user.id,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(user.name, response.body().result);
  });

  test('should replace text with schedule text', async ({ assert, client }) => {
    const { user, ecoGroup, schedule } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const scheduleTemplate = await TemplateReplacement.create({
      economic_group_id: ecoGroup.id,
      origin: TemplateReplacementOrigin.SCHEDULE,
      attribute: 'patientName',
      replacer: '[[PATIENT_NAME]]',
    });

    const response = await client
      .post(`/template-replacements/replace-text`)
      .json({
        base: scheduleTemplate.replacer,
        scheduleId: schedule.id,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(schedule.patientName, response.body().result);
  });

  test('should replace text with tutor text', async ({ assert, client }) => {
    const { user, ecoGroup, tutor } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const tutorTemplate = await TemplateReplacement.create({
      economic_group_id: ecoGroup.id,
      origin: TemplateReplacementOrigin.TUTOR,
      attribute: 'name',
      replacer: '[[NAME]]',
    });

    const response = await client
      .post(`/template-replacements/replace-text`)
      .json({
        base: tutorTemplate.replacer,
        tutorId: tutor.id,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(tutor.name, response.body().result);
  });

  test('should replace text with patient text', async ({ assert, client }) => {
    const { user, ecoGroup, patient } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const patientTemplate = await TemplateReplacement.create({
      economic_group_id: ecoGroup.id,
      origin: TemplateReplacementOrigin.PATIENT,
      attribute: 'name',
      replacer: '[[NAME]]',
    });

    const response = await client
      .post(`/template-replacements/replace-text`)
      .json({
        base: patientTemplate.replacer,
        dependentId: patient.id,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(patient.name, response.body().result);
  });
});
