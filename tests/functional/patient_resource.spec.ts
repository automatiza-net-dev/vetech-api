import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import EconomicGroup from 'App/Models/EconomicGroup';
import Patient, { PatientGender, PatientType } from 'App/Models/Patient';
import User from 'App/Models/User';
import PatientFactory from 'Database/factories/PatientFactory';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Patient resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<
    [User, Patient, Patient, EconomicGroup]
  > => {
    const { user, group } = await userBootstrap();

    const patient = await PatientFactory.create();
    const holder = await PatientFactory.create();
    await holder.merge({ type: PatientType.TUTOR }).save();

    await holder.related('dependents').attach([patient.id]);
    await group.related('patients').attach([patient.id, holder.id]);

    return [user, patient, holder, group];
  };

  const createGroupData = async (group: EconomicGroup) => {
    const patient = await PatientFactory.create();
    const holder = await PatientFactory.create();

    await holder.related('dependents').attach([patient.id]);
    await group.related('patients').attach([patient.id, holder.id]);

    return { patient, holder };
  };

  test('should create new patient', async ({ client, assert }) => {
    const [user, holder] = await createData();
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
        tags: 'tag',
        birthDate: new Date('2000-01-01'),
        holderId: holder.id,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should return list of patients from clinic', async ({
    client,
    assert,
  }) => {
    const [user1, patient1] = await createData();
    const [_, patient2] = await createData();
    const token = await generateJwtToken(client, {
      email: user1.email,
      password: '102030',
    });

    const response = await client.get('/patients').bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(Boolean(body.find(b => b.id === patient1.id)));
    assert.isFalse(Boolean(body.find(b => b.id === patient2.id)));
  });

  test('should throw NotFoundException if no valid patient is found', async ({
    client,
    assert,
  }) => {
    const [user1] = await createData();
    const [_, patient2] = await createData();
    const token = await generateJwtToken(client, {
      email: user1.email,
      password: '102030',
    });

    const response = await client
      .get(`/patients/${patient2.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Paciente não encontrado', body.message);
  });

  test('should return a valid patient', async ({ client, assert }) => {
    const [user, patient] = await createData();
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
    const [user, patient] = await createData();
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
    const [user, patient, holder] = await createData();
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
        birthDate: new Date('2000-01-01'),
        active: true,
        holderId: holder.id,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(patient.id, body.id);
    assert.notEqual(patient.name, body.name);
  });

  test('should create new tutor', async ({ client, assert }) => {
    const [user] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/patient-tutors')
      .json({
        name: 'patient name',
        gender: PatientGender.MALE,
        tags: 'tag',
        birthDate: new Date('2000-01-01'),
        document: '1',
        email: 'mail123123@mail.com',
        cellphone: '123',
        postal_code: '123',
        street: '213',
        number: '123',
        district: '2123',
        city: '123',
        state: '123',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should show tutor', async ({ client, assert }) => {
    const [user, _, patient] = await createData();
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
    const [user, patient] = await createData();
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

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/patient-tutors/${patient.id}`)
      .json({
        name: 'updated tutor',
        gender: PatientGender.MALE,
        tags: 'tag',
        birthDate: new Date('2000-01-01'),
        active: true,
        document: '123',
        inscription: '123',
        corporateName: '123',
        email: '123@mail.com',
        cellphone: '123',
        telephone: '123',
        messagePersonName: '123',
        messagePersonPhone: '123',
        postal_code: '123',
        street: '123',
        number: '123',
        complement: '123',
        district: '123',
        city: '123',
        state: '123',
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(patient.id, body.id);
  });

  test('should search for patient', async ({ client, assert }) => {
    const [user, patient] = await createData();
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
    const [user, _, holder, group] = await createData();
    const { patient } = await createGroupData(group);
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/patient-tutors/nr/${holder.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.isTrue(Boolean(body.find(f => f.id === patient.id)));
  });
});
