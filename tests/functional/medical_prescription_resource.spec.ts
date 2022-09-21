import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import DrugAdministration from 'App/Models/DrugAdministration';
import MedicalPrescription, {
  MedicalPrescriptionFluidSet,
  MedicalPrescriptionFrequency,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import Unit, { UnitType } from 'App/Models/Unit';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Medical prescription resource', group => {
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

    const unit = await Unit.create({
      name: 'some unit',
      economic_group_id: group.id,
      tag: 'some tag',
      type: UnitType.PRODUCT,
    });

    const prescription = await MedicalPrescription.create({
      business_unit_id: business.id,
      name: 'some name',
      type: MedicalPrescriptionType.MEDICATION,
      prescribedAt: DateTime.now(),
      frequency: MedicalPrescriptionFrequency.ONCE,
      frequencyInterval: 1,
      frequencyUnit: MedicalPrescriptionFrequencyUnit.DAY,
      frequencyQuantity: 1,
      frequencyQuantityUnit: MedicalPrescriptionFrequencyQuantityUnit.DAY,
      dose: 1,
      prescription_unit_id: unit.id,
      drug_administration_id: drug.id,
      description: 'some description',
      resume: 'some resume',
      fluid_unit_id: unit.id,
      fluidSet: MedicalPrescriptionFluidSet.MACRODROPS,
      fluidSpeed: 1,
      supplement: 'some supplement',
    });

    return { user, drug, prescription };
  };

  test('should return all medical prescriptions', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/medical-prescriptions`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });

  test('should create medical prescriptions (PR)', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/medical-prescriptions`)
      .json({
        name: 'some name',
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
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/medical-prescriptions`)
      .json({
        name: 'some name',
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
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/medical-prescriptions`)
      .json({
        name: 'some name',
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
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/medical-prescriptions`)
      .json({
        name: 'some name',
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
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/medical-prescriptions`)
      .json({
        name: 'some name',
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

  test('should throw ResouceNotFound if no prescription was found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/medical-prescriptions/${v4()}`)
      .bearerToken(token);
    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Recurso não encontrado', body.message);
  });

  test('should return given prescription', async ({ client, assert }) => {
    const { user, prescription } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/medical-prescriptions/${prescription.id}`)
      .bearerToken(token);
    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(prescription.id, body.id);
  });

  test('should delete a prescription', async ({ client, assert }) => {
    const { user, prescription } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/medical-prescriptions/${prescription.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
