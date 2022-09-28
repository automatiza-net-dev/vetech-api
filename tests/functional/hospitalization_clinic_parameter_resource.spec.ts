import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ClinicParameter from 'App/Models/ClinicParameter';
import Hospitalization from 'App/Models/Hospitalization';
import PatientFactory from 'Database/factories/PatientFactory';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Hospitalization clinic parameter resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business } = await userBootstrap();

    const patient = await PatientFactory.create();

    const hospitalization = await Hospitalization.create({
      business_unit_id: business.id,
      patient_id: patient.id,
      tutor_id: patient.id,
      type: 10,
    });

    const parameter = await ClinicParameter.create({
      name: 'some name',
      tag: 'some tag',
      economic_group_id: group.id,
    });

    const hospClinicParameter = await hospitalization
      .related('parameters')
      .create({
        clinic_parameter_id: parameter.id,
        value: 'some value',
      });

    return { user, hospitalization, parameter, hospClinicParameter };
  };

  test('should create new hospitalization clinic parameter', async ({
    assert,
    client,
  }) => {
    const { user, hospitalization, parameter } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/hospitalization-parameters')
      .json({
        executedAt: new Date(),
        releasedAt: new Date(),
        value: 'some value',
        resume: 'some resume',
        status: 'some status',
        userId: user.id,
        hospitalizationId: hospitalization.id,
        clinicParameterId: parameter.id,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update hospitalization clinic parameter', async ({
    assert,
    client,
  }) => {
    const { user, hospitalization, parameter, hospClinicParameter } =
      await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/hospitalization-parameters/${hospClinicParameter.id}`)
      .json({
        executedAt: new Date(),
        releasedAt: new Date(),
        value: 'some new value',
        resume: 'some resume',
        status: 'some status',
        userId: user.id,
        hospitalizationId: hospitalization.id,
        clinicParameterId: parameter.id,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(hospClinicParameter.id, response.body().id);
    assert.notEqual(hospClinicParameter.value, response.body().value);
  });

  test('should soft delete hospitalization clinic parameter', async ({
    assert,
    client,
  }) => {
    const { user, hospClinicParameter } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/hospitalization-parameters/${hospClinicParameter.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
