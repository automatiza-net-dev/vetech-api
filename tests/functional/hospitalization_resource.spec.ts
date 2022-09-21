import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Bed, { BedType } from 'App/Models/Bed';
import Hospitalization from 'App/Models/Hospitalization';
import PatientFactory from 'Database/factories/PatientFactory';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Hospitalization resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business } = await userBootstrap();

    const patient = await PatientFactory.create();

    const hospitalization = await Hospitalization.create({
      business_unit_id: business.id,
      patient_id: patient.id,
      tutor_id: patient.id,
      type: 10,
      complaint: 'Test',
    });

    const bed = await Bed.create({
      name: 'Bed 1',
      business_id: business.id,
      tag: 'bed-1',
      type: BedType.HOSPITALIZATION,
    });

    return { user, patient, hospitalization, bed };
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
        type: 10,
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
        type: 11111,
        risk: 1,
        expectedDischarge: new Date(),
        diagnosis: 'some diagnosis',
        prognosis: 'some prognosis',
        bedId: bed.id,
        status: 'some status',
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
});
