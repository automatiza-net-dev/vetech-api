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
        frequencyInterval: 10,
        frequencyUnit: 'HOUR',
        frequencyQuantity: 10,
        frequencyQuantityUnit: 'HOUR',
        prescriptionUnitId: '57e2fa72-c0ff-468b-812b-b84bcc67c94c',
        dose: 10,
        drugAdministrationId: '265d2b6f-6ee0-42da-bdbf-4991dc83524c',
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
        frequencyInterval: 10,
        frequencyUnit: 'HOUR',
        frequencyQuantity: 10,
        frequencyQuantityUnit: 'HOUR',
        prescriptionUnitId: '57e2fa72-c0ff-468b-812b-b84bcc67c94c',
        dose: 10,
        drugAdministrationId: '265d2b6f-6ee0-42da-bdbf-4991dc83524c',
        fluidSet: 'MACRODROPS',
        fluidSpeed: 10,
        fluidUnitId: '57e2fa72-c0ff-468b-812b-b84bcc67c94c',
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
        prescriptionUnitId: '57e2fa72-c0ff-468b-812b-b84bcc67c94c',
        dose: 10,
        drugAdministrationId: '265d2b6f-6ee0-42da-bdbf-4991dc83524c',
        fluidSet: 'MACRODROPS',
        fluidSpeed: 10,
        fluidUnitId: '57e2fa72-c0ff-468b-812b-b84bcc67c94c',
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
        prescriptionUnitId: '57e2fa72-c0ff-468b-812b-b84bcc67c94c',
        dose: 10,
        drugAdministrationId: '265d2b6f-6ee0-42da-bdbf-4991dc83524c',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });
});
