import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import TefAcquirer from 'App/Models/TefAcquirer';
import { IUpdateUnitUser } from 'Contracts/interfaces/IUpdateUnitUser';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Business unit resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business, role } = await userBootstrap();

    return {
      user,
      group,
      business,
      role,
    };
  };

  test('should return a list of all business units', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/business-units');

    const businessUnits = response.body();

    assert.isArray(businessUnits);
  });

  test('update business unit', async ({ client, assert }) => {
    const { business } = await createData();
    const response = await client.put(`/business-units/${business.id}`).json({
      identification: 'TESTING',
      simple: true,
      cityCode: '123',
    });

    const updatedBusinessUnit = response.body();

    assert.equal(business.id, updatedBusinessUnit.id);
    assert.notEqual(
      business.identification,
      updatedBusinessUnit.identification,
    );
  });

  test('should return a list of users from the business unit', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/business-units/users`)
      .bearerToken(token);

    const userList = response.body();

    assert.isArray(userList);
  });

  test('should return a list of states', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/business-units/states`)
      .bearerToken(token);

    const userList = response.body();

    assert.isArray(userList);
  });

  test('should return a list of business units from logged user', async ({
    client,
    assert,
  }) => {
    const { user, business } = await createData();

    const response = await client.get(`/business-units/user`).loginAs(user);

    const units = response.body();

    assert.isArray(units);
    assert.equal(business.id, units[0].id);
  });

  test('should create new business unit', async ({ client, assert }) => {
    const { user, group } = await createData();

    const response = await client
      .post(`/business-units/`)
      .json({
        economic_group_id: group.id,
        document: '81021647000100',
        email: 'mail@mail.com',
        stateRegistration: 'some',
        cityRegistration: 'some',
        cnae: 'some',
        simple: true,
        cityCode: '123',
      })
      .loginAs(user);

    assert.equal(201, response.status());
  });

  test('should throw NotFoundException if no acquirer was found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/business-units/update-acquirer/${v4()}`)
      .json({
        document: '81021647000100',
        active: true,
      })
      .bearerToken(token);

    assert.equal(404, response.status());
  });

  test('update business unit acquirer', async ({ client, assert }) => {
    const { user, business, group } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const tefAcq = await TefAcquirer.create({
      economic_group_id: group.id,
      description: 'any description',
    });

    const acq = await business.related('acquirers').create({
      tef_acquirer_id: tefAcq.id,
      document: '81021647000100',
      active: true,
    });

    const response = await client
      .put(`/business-units/update-acquirer/${acq.id}`)
      .json({
        document: '81021647000100',
        active: true,
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should throw NotFoundException if no acquirer was found when deleting', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/business-units/delete-acquirer/${v4()}`)
      .bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should delete business unit acquirer', async ({ client, assert }) => {
    const { user, business, group } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const tefAcq = await TefAcquirer.create({
      economic_group_id: group.id,
      description: 'any description',
    });

    const acq = await business.related('acquirers').create({
      tef_acquirer_id: tefAcq.id,
      document: '81021647000100',
      active: true,
    });

    const response = await client
      .delete(`/business-units/delete-acquirer/${acq.id}`)

      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should return existing false for invalid document', async ({
    client,
    assert,
  }) => {
    const response = await client.get(
      `/business-units/check-document/invalid-email`,
    );

    const body = response.body();

    assert.equal(200, response.status());
    assert.isFalse(body.valid);
  });

  test('should return existing true for valid document and false for in usage', async ({
    client,
    assert,
  }) => {
    const response = await client.get(
      `/business-units/check-document/74069759000167`,
    );

    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(body.valid);
    assert.isFalse(body.exists);
  });

  test('should return existing true for valid document and true for in usage', async ({
    client,
    assert,
  }) => {
    await createData();
    const response = await client.get(
      `/business-units/check-document/45370407000149`,
    );

    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(body.valid);
    assert.isTrue(body.exists);
  });

  test('should add new collaborator to business unit', async ({
    client,
    assert,
  }) => {
    const { user, role } = await createData();
    const { user: userToAdd } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/business-units/add-collaborator`)
      .json({
        roleId: role.id,
        userId: userToAdd.id,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should throw BadRequestException for existing role', async ({
    client,
    assert,
  }) => {
    const { user, role } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/business-units/add-collaborator`)
      .json({
        roleId: role.id,
        userId: user.id,
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should update collaborator from business unit', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/business-units/user/${user.id}`)
      .json({
        licensingJob: 'any',
        inscription: 'any',
        onDuty: false,
      } as IUpdateUnitUser)
      .bearerToken(token);

    assert.equal(200, response.status());
  });
});
