import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import DrugAdministration from 'App/Models/DrugAdministration';
import Hospitalization from 'App/Models/Hospitalization';
import {
  MedicalPrescriptionFrequency,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import PatientFactory from 'Database/factories/PatientFactory';
import { DateTime } from 'luxon';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Hospitalization medical prescription resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business } = await userBootstrap();

    const drug = await DrugAdministration.create({
      description: 'some description',
      economic_group_id: group.id,
    });

    const patient = await PatientFactory.create();

    const hospitalization = await Hospitalization.create({
      business_unit_id: business.id,
      patient_id: patient.id,
      tutor_id: patient.id,
      type: 10,
      expectedDischarge: DateTime.now().plus({ days: 2 }),
    });

    return { user, drug, hospitalization };
  };

  test('should create medical prescriptions (PR)', async ({
    assert,
    client,
  }) => {
    const { user, hospitalization } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/hospitalization-prescriptions`)
      .json({
        hospitalizationId: hospitalization.id,
        type: MedicalPrescriptionType.PROCEDURE,
        prescribedAt: '2022-01-01',
        frequency: MedicalPrescriptionFrequency.RECURRENT,
        description: 'some description',
        resume: 'some resume',
        executionStart: new Date(),
        frequencyInterval: 10,
        frequencyUnit: MedicalPrescriptionFrequencyUnit.DAY,
        frequencyQuantity: 10,
        frequencyQuantityUnit: MedicalPrescriptionFrequencyQuantityUnit.HOUR,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create medical prescriptions (MR)', async ({
    assert,
    client,
  }) => {
    const { user, hospitalization } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/hospitalization-prescriptions`)
      .json({
        hospitalizationId: hospitalization.id,
        type: 'MEDICATION',
        prescribedAt: '2022-01-01',
        frequency: 'RECURRENT',
        description: 'some description',
        resume: 'some resume',
        executionStart: new Date(),
        frequencyInterval: 10,
        frequencyUnit: 'HOUR',
        frequencyQuantity: 10,
        frequencyQuantityUnit: 'HOUR',
        prescriptionUnitId: '75f142de-75fb-4277-9c4f-1a27eb7b60e3',
        dose: 10,
        drugAdministrationId: 'ec3a2212-bbe5-4274-8836-bc8d99ef66e7',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create medical prescriptions (FR)', async ({
    assert,
    client,
  }) => {
    const { user, hospitalization } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/hospitalization-prescriptions`)
      .json({
        hospitalizationId: hospitalization.id,
        type: 'FLUID_THERAPY',
        prescribedAt: '2022-01-01',
        frequency: 'RECURRENT',
        description: 'some description',
        resume: 'some resume',
        executionStart: new Date(),
        frequencyInterval: 10,
        frequencyUnit: 'HOUR',
        frequencyQuantity: 10,
        frequencyQuantityUnit: 'HOUR',
        prescriptionUnitId: '75f142de-75fb-4277-9c4f-1a27eb7b60e3',
        dose: 10,
        drugAdministrationId: 'ec3a2212-bbe5-4274-8836-bc8d99ef66e7',
        fluidSet: 'MACRODROPS',
        fluidSpeed: 10,
        fluidUnitId: '75f142de-75fb-4277-9c4f-1a27eb7b60e3',
        supplement: 'some supplement',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create medical prescriptions (F_)', async ({
    assert,
    client,
  }) => {
    const { user, hospitalization } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/hospitalization-prescriptions`)
      .json({
        hospitalizationId: hospitalization.id,
        type: 'FLUID_THERAPY',
        prescribedAt: '2022-01-01',
        frequency: 'WHEN_NEEDED',
        description: 'some description',
        resume: 'some resume',
        executionStart: new Date(),
        prescriptionUnitId: '75f142de-75fb-4277-9c4f-1a27eb7b60e3',
        dose: 10,
        drugAdministrationId: 'ec3a2212-bbe5-4274-8836-bc8d99ef66e7',
        fluidSet: 'MACRODROPS',
        fluidSpeed: 10,
        fluidUnitId: '75f142de-75fb-4277-9c4f-1a27eb7b60e3',
        supplement: 'some supplement',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create medical prescriptions (M_)', async ({
    assert,
    client,
  }) => {
    const { user, hospitalization } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/hospitalization-prescriptions`)
      .json({
        hospitalizationId: hospitalization.id,
        type: 'MEDICATION',
        prescribedAt: '2022-01-01',
        frequency: 'ONCE',
        description: 'some description',
        resume: 'some resume',
        executionStart: new Date(),
        prescriptionUnitId: '75f142de-75fb-4277-9c4f-1a27eb7b60e3',
        dose: 10,
        drugAdministrationId: 'ec3a2212-bbe5-4274-8836-bc8d99ef66e7',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });
});
