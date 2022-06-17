import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Permission from 'App/Models/Permission';
import Role from 'App/Models/Role';
import PermissionFactory from 'Database/factories/PermissionFactory';
import RoleFactory from 'Database/factories/RoleFactory';
import { v4 } from 'uuid';

test.group('Role resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createRole = async (): Promise<[Role, Permission]> => {
    const model = await RoleFactory.create();
    const model2 = await PermissionFactory.create();

    return [model, model2];
  };

  test('should return a list of all roles', async ({ client, assert }) => {
    const response = await client.get('/roles');

    const roles = response.body();

    assert.isArray(roles);
  });

  test('should return a role', async ({ client, assert }) => {
    const [role] = await createRole();

    const response = await client.get(`/roles/${role.id}`);

    const body = response.body();

    assert.equal(role.id, body.id);
    assert.equal(role.name, body.name);
  });

  test('should return an exception on role not found', async ({
    client,
    assert,
  }) => {
    const response = await client.get(`/roles/1000000000`);

    const body = response.body();

    assert.equal(
      'E_NOT_FOUND: Cargo não foi encontrado',
      body.message as string,
    );
  });

  test('should create a new role', async ({ client, assert }) => {
    const response = await client.post('/roles').json({
      name: v4(),
    });

    assert.equal(201, response.status());
  });

  test('should update a role', async ({ client, assert }) => {
    const [role] = await createRole();

    const response = await client.put(`/roles/${role.id}`).json({
      name: v4(),
    });

    const body = response.body();

    assert.equal(role.id, body.id);
    assert.notEqual(role.name, body.name);
  });

  test('should delete a role', async ({ client, assert }) => {
    const [role] = await createRole();

    const response = await client.delete(`/roles/${role.id}`);

    assert.equal(204, response.status());
  });

  test('should add a permission to a role', async ({ client, assert }) => {
    const [role, permission] = await createRole();

    const response = await client.post(`/roles/add-permission`).json({
      role_id: role.id,
      permission_id: permission.id,
    });

    assert.equal(201, response.status());
  });

  test('should remove a permission to a role', async ({ client, assert }) => {
    const [role, permission] = await createRole();

    await client.post(`/roles/add-permission`).json({
      role_id: role.id,
      permission_id: permission.id,
    });

    const response = await client.delete(`/roles/${role.id}/${permission.id}`);
    assert.equal(204, response.status());
  });
});
