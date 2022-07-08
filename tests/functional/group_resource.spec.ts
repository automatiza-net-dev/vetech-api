import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { LicenceType } from 'App/Models/Licence';
import RoleFactory from 'Database/factories/RoleFactory';
import UserFactory from 'Database/factories/UserFactory';
import { addDays } from 'date-fns';
import { v4 } from 'uuid';

import { generateJwtToken } from '../utils';

test.group('Group resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const user = await UserFactory.create();

    const newGroup = await user.related('economicGroups').create({
      id: v4(),
      document: user.document,
      responsibleEmail: user.email,
      responsiblePhone: user.phone,
    });

    const resGroup = await newGroup.related('groups').create({
      name: 'group 1',
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

    return { user, resGroup };
  };

  test('should return all groups', async ({ assert, client }) => {
    const { user, resGroup } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/groups').bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.isTrue(Boolean(body.find(b => b.id === resGroup.id)));
  });

  test('should create a new group', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/groups')
      .json({
        name: 'new group',
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(201, response.status());
    assert.equal('new group', body.name);
  });

  test('should throw ResourceNotFound for invalid group', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/groups/${v4()}`).bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Recurso não encontrado', body.message);
  });

  test('should return valid group', async ({ assert, client }) => {
    const { user, resGroup } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/groups/${resGroup.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(resGroup.id, body.id);
  });

  test('should update the group', async ({ assert, client }) => {
    const { user, resGroup } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/groups/${resGroup.id}`)
      .json({
        name: 'updated group',
        active: true,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(resGroup.id, body.id);
    assert.notEqual(resGroup.name, body.name);
  });

  test('should soft delete the group', async ({ assert, client }) => {
    const { user, resGroup } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/groups/${resGroup.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
