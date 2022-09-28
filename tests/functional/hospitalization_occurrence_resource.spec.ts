import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Hospitalization from 'App/Models/Hospitalization';
import {
  MedicalPrescriptionFrequency,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import Occurrence, { OccurrenceType } from 'App/Models/Occurrence';
import PatientFactory from 'Database/factories/PatientFactory';
import { DateTime } from 'luxon';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Hospitalization occurrence resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business } = await userBootstrap();

    const occurrence = await Occurrence.create({
      economic_group_id: group.id,
      description: 'some description',
      type: OccurrenceType.ADMISSAO_INTERNACAO,
    });

    const patient = await PatientFactory.create();
    const hospitalization = await Hospitalization.create({
      business_unit_id: business.id,
      patient_id: patient.id,
      tutor_id: patient.id,
      type: 10,
    });

    const prescription = await hospitalization
      .related('medicalPrescriptions')
      .create({
        type: MedicalPrescriptionType.MEDICATION,
        prescribedAt: DateTime.now(),
        frequency: MedicalPrescriptionFrequency.ONCE,
        description: 'some description',
        resume: 'some resume',
        frequencyInterval: 10,
        frequencyUnit: MedicalPrescriptionFrequencyUnit.DAY,
        frequencyQuantity: 10,
        frequencyQuantityUnit: MedicalPrescriptionFrequencyQuantityUnit.DAY,
      });

    const hospOccurrence = await hospitalization.related('occurrences').create({
      occurrence_id: occurrence.id,
      description: 'some description',
      executedAt: DateTime.now(),
    });

    return { user, hospitalization, occurrence, prescription, hospOccurrence };
  };

  test('should create hospitalization occurrence', async ({
    assert,
    client,
  }) => {
    const { user, hospitalization, occurrence, prescription } =
      await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/hospitalization-occurrences`)
      .json({
        hospitalizationId: hospitalization.id,
        occurrenceId: occurrence.id,
        hospitalizationMedicalPrescriptionId: prescription.id,
        description: 'some description',
        executedAt: new Date(),
        resume: 'some resume',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw NotFoundException for invalid hospitalization', async ({
    assert,
    client,
  }) => {
    const { user, occurrence, prescription, hospOccurrence } =
      await createData();
    const { hospitalization } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/hospitalization-occurrences/${hospOccurrence.id}`)
      .json({
        hospitalizationId: hospitalization.id,
        occurrenceId: occurrence.id,
        hospitalizationMedicalPrescriptionId: prescription.id,
        description: 'some new description',
        executedAt: new Date(),
        resume: 'some resume',
        active: true,
      })
      .bearerToken(token);

    assert.equal(404, response.status());
    assert.equal(
      'E_NOT_FOUND: Recurso não encontrado',
      response.body().message,
    );
  });

  test('should update hospitalization occurrence', async ({
    assert,
    client,
  }) => {
    const { user, hospitalization, occurrence, prescription, hospOccurrence } =
      await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/hospitalization-occurrences/${hospOccurrence.id}`)
      .json({
        hospitalizationId: hospitalization.id,
        occurrenceId: occurrence.id,
        hospitalizationMedicalPrescriptionId: prescription.id,
        description: 'some new description',
        executedAt: new Date(),
        resume: 'some resume',
        active: true,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(hospOccurrence.id, response.body().id);
    assert.notEqual(hospOccurrence.description, response.body().description);
  });

  test('should delete hospitalization occurrence', async ({
    assert,
    client,
  }) => {
    const { user, hospOccurrence } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/hospitalization-occurrences/${hospOccurrence.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
