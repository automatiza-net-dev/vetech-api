import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Permission from 'App/Models/Permission';
import Role from 'App/Models/Role';
import Screen from 'App/Models/Screen';
import IManageRolePermissions from 'Contracts/interfaces/IManageRolePermissions';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Role resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, system } = await userBootstrap();

    const screen = await Screen.create({
      name: v4(),
    });

    const permission = await Permission.create({
      control: v4(),
      description: v4(),
      screen_id: screen.id,
    });

    const role = await Role.create({
      name: v4(),
      system_id: system.id,
      economic_group_id: group.id,
      type: 'system',
    });

    await role.related('permissions').attach([permission.id]);

    return { user, role, permission };
  };

  test('should return a list of all roles', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/roles').bearerToken(token);

    const roles = response.body();

    assert.isArray(roles);
  });

  test('should return a role', async ({ client, assert }) => {
    const { user, role } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/roles/${role.id}`).bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should return an exception on role not found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/roles/-1`).bearerToken(token);

    const body = response.body();

    assert.equal(
      'E_NOT_FOUND: Cargo não foi encontrado',
      body.message as string,
    );
  });

  test('should create a new role', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/roles')
      .json({
        name: v4(),
        type: 'system',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update a role', async ({ client, assert }) => {
    const { user, role } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/roles/${role.id}`)
      .json({
        name: v4(),
        type: 'system',
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(role.id, body.id);
    assert.notEqual(role.name, body.name);
  });

  test('should delete a role', async ({ client, assert }) => {
    const { user, role } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/roles/${role.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should manage role permissions', async ({ client, assert }) => {
    const { user, role, permission } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/roles/permissions`)
      .json({
        data: [
          {
            role: role.id,
            permissions: [
              {
                id: permission.id,
                active: false,
              },
            ],
          },
        ],
      } as IManageRolePermissions)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
