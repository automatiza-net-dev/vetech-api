import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Bed, { BedType } from 'App/Models/Bed';
import Hospitalization, {
  HospitalizationStatus,
  HospitalizationType,
} from 'App/Models/Hospitalization';
import {
  MedicalPrescriptionFrequency,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import { PatientType } from 'App/Models/Patient';
import PatientAnimalHair from 'App/Models/PatientAnimalHair';
import PatientFactory from 'Database/factories/PatientFactory';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Hospitalization resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const specie = await group.related('species').create({
      id: v4(),
      description: 'some specie',
    });

    const race = await specie.related('races').create({
      id: v4(),
      description: 'some race',
      economic_group_id: group.id,
    });

    const hair = await PatientAnimalHair.create({
      description: 'some hair',
    });

    const patient = await PatientFactory.create();
    await patient.merge({ type: PatientType.ANIMAL }).save();
    await patient.related('patientAnimal').create({
      race_id: race.id,
      hair_id: hair.id,
    });

    await patient.related('tutor').create({
      document: '12345678910',
      cellphone: '12345678910',
      telephone: '12345678910',
    });

    const bed = await Bed.create({
      name: 'Bed 1',
      business_id: business.id,
      tag: 'bed-1',
      type: BedType.HOSPITALIZATION,
    });

    const hospitalization = await Hospitalization.create({
      business_unit_id: business.id,
      patient_id: patient.id,
      tutor_id: patient.id,
      type: HospitalizationType.Internação,
      complaint: 'Test',
      bed_id: bed.id,
      expectedDischarge: DateTime.now().plus({ days: 1 }),
    });

    const prescription = await hospitalization
      .related('medicalPrescriptions')
      .create({
        resume: 'teste resumo',
        description: 'teste descrição',
        status: 'A',
        type: MedicalPrescriptionType.FLUID_THERAPY,
        prescribedAt: DateTime.now(),
        frequency: MedicalPrescriptionFrequency.ONCE,
        executionStart: DateTime.now(),
        user_id: user.id,
        volume: '10',
        frequencyInterval: 10,
        frequencyUnit: MedicalPrescriptionFrequencyUnit.DAY,
        frequencyQuantity: 10,
        frequencyQuantityUnit: MedicalPrescriptionFrequencyQuantityUnit.DAY,
      });

    await prescription.related('scheduling').create({
      description: 'teste descrição',
    });

    return { user, patient, hospitalization, bed, business };
  };

  test('should return a list of hospitalizations', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/hospitalizations`).bearerToken(token);

    response.assertStatus(200);
    assert.isArray(response.body());
  });

  test('should return the parsed index', async ({ assert, client }) => {
    const { user, patient } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const urlParams = new URLSearchParams();
    urlParams.append('hospitalized_from', new Date().toISOString());
    urlParams.append('hospitalized_to', new Date().toISOString());

    urlParams.append('death_from', new Date().toISOString());
    urlParams.append('death_to', new Date().toISOString());

    urlParams.append('released_from', new Date().toISOString());
    urlParams.append('released_to', new Date().toISOString());

    urlParams.append('type', HospitalizationType.Internação.toString());
    urlParams.append('status', HospitalizationStatus.ACTIVE);
    urlParams.append('patient', patient.id);

    const response = await client
      .get(`/hospitalizations/parsed-index?${urlParams.toString()}`)
      .bearerToken(token);

    response.assertStatus(200);
    assert.isArray(response.body());
  });

  test('should return a list of completed hospitalizations', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/hospitalizations/completed`)
      .bearerToken(token);

    response.assertStatus(200);
    assert.isArray(response.body());
  });

  test('should throw BadRequestException if patient is already hospitalized', async ({
    assert,
    client,
  }) => {
    const { user, patient, business } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await Hospitalization.create({
      type: 2,
      risk: 1,
      complaint: 'some complaint',
      expectedDischarge: DateTime.now(),
      diagnosis: 'some diagnosis',
      prognosis: 'some prognosis',
      status: HospitalizationStatus.ACTIVE,
      economic_group_id: business.economicGroupId,
      business_unit_id: business.id,
      patient_id: patient.id,
      tutor_id: patient.id,
    });

    const response = await client
      .post('/hospitalizations')
      .json({
        tutorId: patient.id,
        patientId: patient.id,
        type: 2,
        complaint: 'Test',
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should create new hospitalization', async ({ assert, client }) => {
    const { user, patient } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/hospitalizations')
      .json({
        tutorId: patient.id,
        patientId: patient.id,
        type: 2,
        complaint: 'Test',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should return ResourceNotFoundException if hospitalization does not exists', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/hospitalizations/${v4()}`)
      .bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should return hospitalization', async ({ client, assert }) => {
    const { user, hospitalization } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/hospitalizations/${hospitalization.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should throw BadRequestException if completing already completed hospitalization', async ({
    client,
    assert,
  }) => {
    const { user, hospitalization } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await hospitalization
      .merge({
        status: HospitalizationStatus.COMPLETE,
      })
      .save();

    const response = await client
      .put(`/hospitalizations/complete/${hospitalization.id}`)
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should complete hospitalization', async ({ client, assert }) => {
    const { user, hospitalization } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await hospitalization
      .merge({
        status: HospitalizationStatus.ACTIVE,
      })
      .save();

    const response = await client
      .put(`/hospitalizations/complete/${hospitalization.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should update hospitalization', async ({ client, assert }) => {
    const { user, hospitalization, patient, bed } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/hospitalizations/${hospitalization.id}`)
      .json({
        tutorId: patient.id,
        patientId: patient.id,
        type: 2,
        risk: 1,
        expectedDischarge: new Date(),
        diagnosis: 'some diagnosis',
        prognosis: 'some prognosis',
        bedId: bed.id,
        status: 'A',
        complaint: 'Test',
      })
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should soft delete hospitalization', async ({ client, assert }) => {
    const { user, hospitalization } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/hospitalizations/${hospitalization.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should get info', async ({ client, assert }) => {
    const { user, hospitalization } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/hospitalizations/info/${hospitalization.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });
});
