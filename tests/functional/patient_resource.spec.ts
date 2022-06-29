import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { LicenceType } from 'App/Models/Licence';
import Patient, { PatientGender, PatientType } from 'App/Models/Patient';
import User from 'App/Models/User';
import PatientFactory from 'Database/factories/PatientFactory';
import RoleFactory from 'Database/factories/RoleFactory';
import UserFactory from 'Database/factories/UserFactory';
import { addDays } from 'date-fns';
import { v4 } from 'uuid';

import { generateJwtToken } from '../utils';

test.group('Patient resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<[User, Patient]> => {
    const user = await UserFactory.create();
    const newGroup = await user.related('economicGroups').create({
      id: v4(),
      document: user.document,
      responsibleEmail: user.email,
      responsiblePhone: user.phone,
    });

    const newBusinessUnit = await newGroup.related('businessUnits').create({
      id: v4(),
      document: user.document,
      phone: user.phone,
      email: user.email,
      origin: 'TESTING',
    });

    await newBusinessUnit.related('licences').create({
      id: v4(),
      active: true,
      expirationDate: addDays(new Date(), 1),
      type: LicenceType.TRIAL,
    });

    const role = await RoleFactory.create();

    await user.related('roles').create({
      role_id: role.id,
      unit_id: newBusinessUnit.id,
    });

    const patient = await PatientFactory.create();
    await newGroup.related('patients').attach([patient.id]);

    return [user, patient];
  };

  test('should create new patient', async ({ client, assert }) => {
    const [user] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/patients')
      .json({
        name: 'patient name',
        type: PatientType.TUTOR,
        gender: PatientGender.MALE,
        tags: 'tag',
        birthDate: new Date('2000-01-01'),
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
    const [user, patient] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/patients/${patient.id}`)
      .json({
        name: 'updated patient',
        type: PatientType.TUTOR,
        gender: PatientGender.MALE,
        tags: 'tag',
        birthDate: new Date('2000-01-01'),
        active: true,
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
    const [user, patient] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const tutored = await patient.related('tutored').create({
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
    assert.equal(tutored.id, body.tutored[0].id);
  });
});
