import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Permission from 'App/Models/Permission';
import PermissionFactory from 'Database/factories/PermissionFactory';
import { v4 } from 'uuid';

test.group('Permission resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createPermission = async (): Promise<[Permission]> => {
    const model = await PermissionFactory.create();

    return [model];
  };

  test('should return a list of all permissions', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/permissions');

    const permissions = response.body();

    assert.isArray(permissions);
  });

  test('should return a permission', async ({ client, assert }) => {
    const [permission] = await createPermission();

    const response = await client.get(`/permissions/${permission.id}`);

    const responseBody = response.body();

    assert.equal(permission.id, responseBody.id);
  });

  test('should create a permission', async ({ client, assert }) => {
    const response = await client.post('/permissions').json({
      name: v4(),
    });

    assert.equal(201, response.status());
  });

  test('update permission', async ({ client, assert }) => {
    const [permission] = await createPermission();
    const response = await client.put(`/permissions/${permission.id}`).json({
      name: 'UPDATED',
    });

    const updatedPermission = response.body();

    assert.equal(permission.id, updatedPermission.id);
    assert.notEqual(permission.name, updatedPermission.name);
  });

  test('should delete a permission', async ({ client, assert }) => {
    const [permission] = await createPermission();

    const response = await client.delete(`/permissions/${permission.id}`);

    assert.equal(204, response.status());
  });
});
