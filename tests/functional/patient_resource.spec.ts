import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ClientOrigin, { ClientOriginType } from 'App/Models/ClientOrigin';
import EconomicGroup from 'App/Models/EconomicGroup';
import { PatientGender, PatientType } from 'App/Models/Patient';
import PatientAnimalHair from 'App/Models/PatientAnimalHair';
import Profession from 'App/Models/Profession';
import IPatientData from 'Contracts/interfaces/IPatientData';
import IPatientSupplierData from 'Contracts/interfaces/IPatientSupplierData';
import IPatientTutorData from 'Contracts/interfaces/IPatientTutorData';
import PatientFactory from 'Database/factories/PatientFactory';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Patient resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group } = await userBootstrap();

    const profession = await Profession.create({
      description: 'some description',
    });

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
      document: 'some',
      cellphone: 'some',
      telephone: 'some',
    });

    const holder = await PatientFactory.create();
    await holder.merge({ type: PatientType.TUTOR }).save();
    await holder.related('tutor').create({
      document: '94562755000123',
      street: 'some street',
      number: '123',
      district: 'some district',
      city: 'some city',
      state: 'some state',
    });

    await holder.related('dependents').attach([patient.id]);
    await group.related('patients').attach([patient.id, holder.id]);

    const origin = await ClientOrigin.create({
      system_id: user.system_id,
      type: ClientOriginType.C,
      description: 'some origin',
    });

    return { user, patient, holder, group, race, hair, profession, origin };
  };

  const createGroupData = async (group: EconomicGroup) => {
    const patient = await PatientFactory.create();
    const holder = await PatientFactory.create();

    await holder.related('dependents').attach([patient.id]);
    await group.related('patients').attach([patient.id, holder.id]);

    return { patient, holder };
  };

  test('should create new patient', async ({ client, assert }) => {
    const { user, holder, race, hair } = await createData();
    await holder.merge({ type: PatientType.TUTOR }).save();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/patients')
      .json({
        name: 'patient name',
        gender: PatientGender.MALE,
        holderId: holder.id,
        raceId: race.id,
        hairId: hair.id,
        castrated: true,
        microchip: 'any microchip',
        hypertension: true,
        diabetes: true,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should return list of patients from clinic', async ({
    client,
    assert,
  }) => {
    const { user, patient: patient1 } = await createData();
    const { patient: patient2 } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/patients').bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(Boolean(body.find(b => b.id === patient1.id)));
    assert.isFalse(Boolean(body.find(b => b.id === patient2.id)));
  });

  test('should return list of patients from clinic', async ({
    client,
    assert,
  }) => {
    const { user, patient: patient1 } = await createData();
    const { patient: patient2 } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const qs = new URLSearchParams();
    qs.append('tag', '1');
    const response = await client
      .get(`/patients/animals?${qs.toString()}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(Boolean(body.find(b => b.id === patient1.id)));
    assert.isFalse(Boolean(body.find(b => b.id === patient2.id)));
  });

  test('should throw NotFoundException if no valid patient is found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const { patient } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/patients/${patient.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Paciente não encontrado', body.message);
  });

  test('should return a valid patient', async ({ client, assert }) => {
    const { user, patient } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/patients/${patient.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(patient.id, body.id);
  });

  test('should soft delete a patient with a singled related business unit', async ({
    client,
    assert,
  }) => {
    const { user, patient } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/patients/${patient.id}`)
      .bearerToken(token);
    const related = await patient.related('economicGroup').query();

    assert.equal(204, response.status());
    assert.equal(0, related.length); // usuário não tem mais grupos relacionados a ele
  });

  test('should update a patient', async ({ client, assert }) => {
    const { user, patient, holder, race } = await createData();
    await patient.merge({ type: PatientType.ANIMAL }).save();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/patients/${patient.id}`)
      .json({
        name: 'updated patient',
        type: PatientType.ANIMAL,
        gender: PatientGender.MALE,
        tags: 'tag',
        birthDate: DateTime.now(),
        active: true,
        holderId: holder.id,
        raceId: race.id,
        castrated: true,
        microchip: 'any microchip',
        death: false,
        deathDate: null,
        hypertension: true,
        diabetes: true,
        glycemia: 100,
        pressure: '123',
      } as IPatientData)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(patient.id, body.id);
    assert.notEqual(patient.name, body.name);
  });

  test('should get all tutors', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/patient-tutors').bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should create new tutor', async ({ client, assert }) => {
    const { user, profession, origin } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/patient-tutors')
      .json({
        name: 'patient name',
        email: 'mail123123@mail.com',
        cellphone: '123',
        cityCode: 'some',
        diabetes: true,
        hypertension: true,
        professionId: profession.id,
        nationality: 'some',
        civilStatus: 'some',
        clientOriginId: origin.id,
      } as IPatientTutorData)
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should show tutor', async ({ client, assert }) => {
    const { user, patient } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await patient.related('tutor').create({
      id: v4(),
      document: '123',
      inscription: '123',
      corporateName: '123',
      email: '123',
      cellphone: '123',
      telephone: '123',
      messagePersonName: '123',
      messagePersonPhone: '123',
      postalCode: '123',
      street: '123',
      number: '123',
      complement: '123',
      district: '123',
      city: '123',
      state: '123',
    });

    const response = await client
      .get(`/patient-tutors/${patient.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(patient.id, body.id);
  });

  test('should update a tutor', async ({ client, assert }) => {
    const { user, holder, profession, origin } = await createData();
    await holder.related('tutor').create({
      id: v4(),
      document: '123',
      inscription: '123',
      corporateName: '123',
      email: '123',
      cellphone: '123',
      telephone: '123',
      messagePersonName: '123',
      messagePersonPhone: '123',
      postalCode: '123',
      street: '123',
      number: '123',
      complement: '123',
      district: '123',
      city: '123',
      state: '123',
      cityCode: 'some',
    });

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/patient-tutors/${holder.id}`)
      .json({
        name: 'updated tutor',
        clientOriginId: origin.id,
        gender: PatientGender.MALE,
        tags: 'tag',
        birthDate: new Date('2000-01-01'),
        active: true,
        document: '94562755000123',
        inscription: '123',
        corporateName: '123',
        email: '123@mail.com',
        cellphone: '123',
        telephone: '123',
        messagePersonName: '123',
        messagePersonPhone: '123',
        postalCode: '123',
        street: '123',
        number: '123',
        complement: '123',
        district: '123',
        city: '123',
        state: '123',
        diabetes: true,
        hypertension: true,
        professionId: profession.id,
        nationality: 'some',
        civilStatus: 'some',
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(holder.id, body.id);
  });

  test('should search for patient', async ({ client, assert }) => {
    const { user, patient } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/patients/search?patient=${patient.name}`)
      .bearerToken(token);

    const body = response.body();

    assert.isTrue(Boolean(body.find(f => f.id === patient.id)));
  });

  test('should get non related patients', async ({ client, assert }) => {
    const { user, holder, group } = await createData();
    await createGroupData(group);
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/patient-tutors/nr/${holder.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.isArray(body);
  });

  test('should create patient and tutor (fast)', async ({ client, assert }) => {
    const { user, race, group } = await createData();
    await createGroupData(group);
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/patients/fast`)
      .json({
        tutorName: 'some value',
        tutorEmail: 'some-value@mail.com',
        tutorPhone: 'some value',

        patientName: 'some value',
        patientRaceId: race.id,
        patientGender: PatientGender.FEMALE,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should create patient and tutor (fast) 2', async ({
    client,
    assert,
  }) => {
    const { user, group } = await createData();
    await createGroupData(group);
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/patients/fast`)
      .json({
        tutorPhone: 'some value',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should search for suppliers', async ({ client, assert }) => {
    const { user, patient } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await patient
      .merge({
        type: PatientType.SUPPLIER,
      })
      .save();

    const params = new URLSearchParams();
    params.append('name', 'a');
    params.append('document', 'a');

    const response = await client
      .get(`/patient-suppliers?${params.toString()}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should show supplier', async ({ client, assert }) => {
    const { user, holder } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await holder
      .merge({
        type: PatientType.SUPPLIER,
      })
      .save();

    const response = await client
      .get(`/patient-suppliers/${holder.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should create new supplier', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/patient-suppliers')
      .json({
        name: 'patient name',
        email: 'mail123123@mail.com',
        cellphone: '123',
        cityCode: 'some',
        document: '97210938000178',
      } as IPatientSupplierData)
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update supplier', async ({ client, assert }) => {
    const { user, holder } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await holder
      .merge({
        type: PatientType.SUPPLIER,
      })
      .save();
    await holder.related('tutor').create({
      id: v4(),
      document: '123',
      inscription: '123',
      corporateName: '123',
      email: '123',
      cellphone: '123',
      telephone: '123',
      messagePersonName: '123',
      messagePersonPhone: '123',
      postalCode: '123',
      street: '123',
      number: '123',
      complement: '123',
      district: '123',
      city: '123',
      state: '123',
      cityCode: 'some',
    });

    const response = await client
      .put(`/patient-suppliers/${holder.id}`)
      .json({
        name: 'patient name',
        email: 'mail123123@mail.com',
        cellphone: '123',
        cityCode: 'some',
        document: '09270350000142',
        active: true,
      } as IPatientSupplierData)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should return existing false for invalid document', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/patients/check-document/invalid-email`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isFalse(body.valid);
  });

  test('should return existing true for valid document and false for in usage', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/patients/check-document/74069759000167`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(body.valid);
    assert.isFalse(body.exists);
  });

  test('should return existing true for valid document and true for in usage', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/patients/check-document/94562755000123`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(body.valid);
    assert.isTrue(body.exists);
  });
});
