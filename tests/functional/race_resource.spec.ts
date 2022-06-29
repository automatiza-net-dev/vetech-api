import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { LicenceType } from 'App/Models/Licence';
import Race from 'App/Models/Race';
import Specie from 'App/Models/Specie';
import User from 'App/Models/User';
import RoleFactory from 'Database/factories/RoleFactory';
import UserFactory from 'Database/factories/UserFactory';
import { addDays } from 'date-fns';
import { v4 } from 'uuid';

import { generateJwtToken } from '../utils';

test.group('Race resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<[User, Specie, Race]> => {
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

    const role = await RoleFactory.create();

    await user.related('roles').create({
      role_id: role.id,
      unit_id: newBusinessUnit.id,
    });

    await newBusinessUnit.related('licences').create({
      id: v4(),
      active: true,
      expirationDate: addDays(new Date(), 1),
      type: LicenceType.TRIAL,
    });

    const specie = await newGroup.related('species').create({
      id: v4(),
      description: 'some specie',
    });

    const race = await specie.related('races').create({
      id: v4(),
      description: 'some race',
    });

    return [user, specie, race];
  };

  test('should create a new race', async ({ assert, client }) => {
    const [user, specie] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/races')
      .json({
        description: 'some race',
        specie_id: specie.id,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(201, response.status());
    assert.equal('some race', body.description);
  });

  test('should return group races', async ({ assert, client }) => {
    const [user, _, race] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/races`).bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.equal(race.id, body[0].id);
  });

  test('should throw ResourceNotFoundException if no race matches', async ({
    assert,
    client,
  }) => {
    const [user] = await createData();
    const [__, ___, race2] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/races/${race2.id}`).bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Raça não foi encontrada', body.message);
  });

  test('should return the race', async ({ assert, client }) => {
    const [user, _, race] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/races/${race.id}`).bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(race.id, body.id);
  });

  test('should update a race', async ({ assert, client }) => {
    const [user, specie, race] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/races/${race.id}`)
      .json({
        description: 'updated race',
        specie_id: specie.id,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(race.id, body.id);
    assert.equal('updated race', body.description);
  });

  test('should soft delete a race', async ({ assert, client }) => {
    const [user, _, race] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/races/${race.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
