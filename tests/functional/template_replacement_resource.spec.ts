import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import PatientAnimalHair from 'App/Models/PatientAnimalHair';
import Profession from 'App/Models/Profession';
import Race, { RaceFur } from 'App/Models/Race';
import Schedule from 'App/Models/Schedule';
import Specie from 'App/Models/Specie';
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
    const { user, group: ecoGroup, business, system } = await userBootstrap();

    const template = await TemplateReplacement.create({
      economic_group_id: ecoGroup.id,
      origin: TemplateReplacementOrigin.BUSINESS,
      attribute: 'SOME',
      replacer: '[[SOME_1]]',
      system_id: system.id,
    });

    const profession = await Profession.create({
      description: '|PROFESSION|',
    });

    const tutor = await PatientFactory.create();
    await tutor.related('tutor').create({
      street: '|STREET|',
      number: '|10|',
      district: '|DISTRICT|',
      state: '|STATE|',
      city: '|CITY|',
      postalCode: '|POSTAL_CODE|',
      document: '|DOCUMENT',
      cellphone: '|CELLPHONE|',
      email: '|EMAIL|',
      inscription: '|INSCRIPTION|',

      nationality: '|NATIONALITY|',
      civilStatus: '|CIVIL_STATUS|',
      profession_id: profession.id,
    });

    const specie = await Specie.create({
      description: 'SPECIE',
    });
    const race = await Race.create({
      fur: RaceFur.C,
      description: 'RACE',
      specie_id: specie.id,
    });
    const hair = await PatientAnimalHair.create({
      description: 'HAIR',
    });

    const patient = await PatientFactory.create();
    await patient.related('patientAnimal').create({
      race_id: race.id,
      hair_id: hair.id,
      castrated: true,
    });

    const schedule = await Schedule.create({
      business_unit_id: business.id,
      patientName: patient.name,
    });

    return {
      user,
      template,
      ecoGroup,
      business,
      tutor,
      patient,
      schedule,
      system,
    };
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

  test('should throw BadRequestException creating system origin', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/template-replacements/create`)
      .json({
        origin: TemplateReplacementOrigin.SYSTEM,
        attribute: 'SOME',
        replacer: '[[SOME]]',
      })
      .bearerToken(token);

    assert.equal(400, response.status());
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
    const { user, business } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/template-replacements/replace-text`)
      .json({
        base: `[CLINICA_FANTASIA] [CLINICA_RAZAOSOCIAL] [CLINICA_CNPJ] [CLINICA_EMAIL] [CLINICA_ENDERECO] [CLINICA_BAIRRO] [CLINICA_CIDADE] [CLINICA_UF] [CLINICA_CEP] [CLINICA_TELEFONE]`,
        businessUnitId: business.id,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should replace text with user text', async ({ assert, client }) => {
    const { user, business } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/template-replacements/replace-text`)
      .json({
        base: `[USUARIO_NOME] [USUARIO_TRATAMENTO] [USUARIO_CELULAR] [USUARIO_CARGO] [USUARIO_TRABALHO] [USUARIO_CRMV]`,
        userId: user.id,
        businessUnitId: business.id,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
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
  });

  test('should replace text with tutor text', async ({ assert, client }) => {
    const { user, tutor, system } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await TemplateReplacement.fetchOrCreateMany(
      ['replacer', 'system_id'],
      [
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'profession_description',
          replacer: '[TUTOR_PROFISSAO]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'nationality',
          replacer: '[TUTOR_NACIONALIDADE]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'civilStatus',
          replacer: '[TUTOR_ESTADOCIVIL]',
          system_id: system.id,
        },
      ],
    );

    const response = await client
      .post(`/template-replacements/replace-text`)
      .json({
        base: `[TUTOR_NOME] [TUTOR_PRIMEIRONOME] [TUTOR_ENDERECO] [TUTOR_BAIRRO] [TUTOR_CIDADE] [TUTOR_UF] [TUTOR_CEP] [TUTOR_CPF] [TUTOR_TELEFONE] [TUTOR_EMAIL] [TUTOR_RG] [TUTOR_PROFISSAO] [TUTOR_NACIONALIDADE] [TUTOR_ESTADOCIVIL]`,
        tutorId: tutor.id,
      })
      .bearerToken(token);

    console.log(response.body());

    assert.equal(200, response.status());
  });

  test('should replace text with client text', async ({ assert, client }) => {
    const { user, tutor, system } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const templates = await TemplateReplacement.fetchOrCreateMany(
      ['replacer', 'system_id'],
      [
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'name',
          replacer: '[CLIENTE_NOME]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'firstName',
          replacer: '[CLIENTE_PRIMEIRONOME]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'tag',
          replacer: '[CLIENTE_FICHA]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'address',
          replacer: '[CLIENTE_ENDERECO]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'district',
          replacer: '[CLIENTE_BAIRRO]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'city',
          replacer: '[CLIENTE_CIDADE]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'city',
          replacer: '[CLIENTE_UF]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'postalCode',
          replacer: '[CLIENTE_CEP]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'inscription',
          replacer: '[CLIENTE_RG]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'document',
          replacer: '[CLIENTE_CPF]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'cellphone',
          replacer: '[CLIENTE_TELEFONE]',
          system_id: system.id,
        },
        {
          origin: TemplateReplacementOrigin.TUTOR,
          attribute: 'email',
          replacer: '[CLIENTE_EMAIL]',
          system_id: system.id,
        },
      ],
    );

    const response = await client
      .post(`/template-replacements/replace-text`)
      .json({
        base: templates.map(template => template.replacer).join(' '),
        tutorId: tutor.id,
      })
      .bearerToken(token);

    console.log('client??', response.body().result);

    assert.equal(200, response.status());
  });

  test('should replace text with patient text', async ({ assert, client }) => {
    const { user, patient, system } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const templates = await TemplateReplacement.fetchOrCreateMany(
      ['replacer', 'system_id'],
      [
        {
          origin: TemplateReplacementOrigin.PATIENT,
          attribute: 'name',
          replacer: '[PACIENTE_NOME]',
        },
        {
          origin: TemplateReplacementOrigin.PATIENT,
          attribute: 'castrated',
          replacer: '[PACIENTE_CASTRADO]',
        },
        {
          origin: TemplateReplacementOrigin.PATIENT,
          attribute: 'tag',
          replacer: '[PACIENTE_ID]',
        },
        {
          origin: TemplateReplacementOrigin.PATIENT,
          attribute: 'gender',
          replacer: '[PACIENTE_SEXO]',
        },
        {
          origin: TemplateReplacementOrigin.PATIENT,
          attribute: 'numeric_age',
          replacer: '[PACIENTE_IDADE]',
        },
        {
          origin: TemplateReplacementOrigin.PATIENT,
          attribute: 'birthDate',
          replacer: '[PACIENTE_NASCIMENTO]',
        },
        {
          origin: TemplateReplacementOrigin.PATIENT,
          attribute: 'hair',
          replacer: '[PACIENTE_PELAGEM]',
        },
        {
          origin: TemplateReplacementOrigin.PATIENT,
          attribute: 'specie',
          replacer: '[PACIENTE_ESPECIE]',
        },
        {
          origin: TemplateReplacementOrigin.PATIENT,
          attribute: 'race',
          replacer: '[PACIENTE_RACA]',
        },
        {
          origin: TemplateReplacementOrigin.PATIENT,
          attribute: 'weight',
          replacer: '[PACIENTE_PESO]',
        },
        {
          origin: TemplateReplacementOrigin.PATIENT,
          attribute: 'vaccinated',
          replacer: '[PACIENTE_VACINADO]',
        },
      ].map(elem => ({ ...elem, system_id: system.id })),
    );

    const response = await client
      .post(`/template-replacements/replace-text`)
      .json({
        base: templates.map(template => template.replacer).join(' '),
        dependentId: patient.id,
      })
      .bearerToken(token);

    console.log(response.body());

    assert.equal(200, response.status());
  });

  test('should replace text with system date', async ({ assert, client }) => {
    const { user, ecoGroup } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const templates = await TemplateReplacement.createMany([
      {
        economic_group_id: ecoGroup.id,
        origin: TemplateReplacementOrigin.SYSTEM,
        attribute: 'date',
        replacer: '[SISTEMA_DATA]',
      },
      {
        economic_group_id: ecoGroup.id,
        origin: TemplateReplacementOrigin.SYSTEM,
        attribute: 'dateextension',
        replacer: '[SISTEMA_DATAEXTENSO]',
      },
      {
        economic_group_id: ecoGroup.id,
        origin: TemplateReplacementOrigin.SYSTEM,
        attribute: 'time',
        replacer: '[SISTEMA_HORA]',
      },
    ]);

    const response = await client
      .post(`/template-replacements/replace-text`)
      .json({
        base: templates.map(t => t.replacer).join(' '),
      })
      .bearerToken(token);

    assert.equal(200, response.status());
  });
});
