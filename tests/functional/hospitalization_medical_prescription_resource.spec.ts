import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import DrugAdministration from 'App/Models/DrugAdministration';
import Hospitalization, {
  HospitalizationType,
} from 'App/Models/Hospitalization';
import {
  MedicalPrescriptionFrequency,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import Unit, { UnitType } from 'App/Models/Unit';
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
      type: HospitalizationType.Internação,
      expectedDischarge: DateTime.now().plus({ days: 2 }),
    });

    const unit = await Unit.create({
      name: 'some unit',
      economic_group_id: group.id,
      tag: 'some tag',
      type: UnitType.PRODUCT,
    });

    return { user, drug, hospitalization, unit };
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
        volume: '10',
        executionStart: new Date(),
        frequencyInterval: 10,
        frequencyUnit: MedicalPrescriptionFrequencyUnit.DAY,
        frequencyQuantity: 10,
        frequencyQuantityUnit: MedicalPrescriptionFrequencyQuantityUnit.HOUR,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create medical prescriptions (PO)', async ({
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
        frequency: MedicalPrescriptionFrequency.ONCE,
        description: 'some description',
        resume: 'some resume',
        volume: '10',
        executionStart: new Date(),
        frequencyInterval: 10,
        frequencyUnit: MedicalPrescriptionFrequencyUnit.DAY,
        frequencyQuantity: 10,
        frequencyQuantityUnit: MedicalPrescriptionFrequencyQuantityUnit.HOUR,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create medical prescriptions (P_)', async ({
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
        frequency: MedicalPrescriptionFrequency.WHEN_NEEDED,
        description: 'some description',
        resume: 'some resume',
        volume: '10',
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
    const { user, hospitalization, drug, unit } = await createData();
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
        volume: '10',
        executionStart: new Date(),
        frequencyInterval: 10,
        frequencyUnit: 'HOUR',
        frequencyQuantity: 10,
        frequencyQuantityUnit: 'HOUR',
        prescriptionUnitId: unit.id,
        dose: 10,
        drugAdministrationId: drug.id,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create medical prescriptions (FR)', async ({
    assert,
    client,
  }) => {
    const { user, hospitalization, drug, unit } = await createData();
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
        volume: '10',
        executionStart: new Date(),
        frequencyInterval: 10,
        frequencyUnit: 'HOUR',
        frequencyQuantity: 10,
        frequencyQuantityUnit: 'HOUR',
        prescriptionUnitId: unit.id,
        dose: 10,
        drugAdministrationId: drug.id,
        fluidSet: 'MACRODROPS',
        fluidSpeed: 10,
        fluidUnitId: unit.id,
        supplement: 'some supplement',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create medical prescriptions (F_)', async ({
    assert,
    client,
  }) => {
    const { user, hospitalization, drug, unit } = await createData();
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
        volume: '10',
        executionStart: new Date(),
        prescriptionUnitId: unit.id,
        dose: 10,
        drugAdministrationId: drug.id,
        fluidSet: 'MACRODROPS',
        fluidSpeed: 10,
        fluidUnitId: unit.id,
        supplement: 'some supplement',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create medical prescriptions (M_)', async ({
    assert,
    client,
  }) => {
    const { user, hospitalization, drug, unit } = await createData();
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
        volume: '10',
        executionStart: new Date(),
        prescriptionUnitId: unit.id,
        dose: 10,
        drugAdministrationId: drug.id,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });
});
