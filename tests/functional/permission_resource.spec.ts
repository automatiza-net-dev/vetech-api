import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Permission from 'App/Models/Permission';
import Screen from 'App/Models/Screen';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Permission resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, system } = await userBootstrap();

    const permission = await Permission.create({
      control: v4(),
      description: v4(),
    });
    await permission.related('systems').attach([system.id]);

    const screen = await Screen.create({
      name: v4(),
    });

    return { user, permission, screen };
  };

  test('should return a list of all permissions', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/permissions').bearerToken(token);

    const permissions = response.body();

    assert.isArray(permissions);
  });

  test('should return a permission', async ({ client, assert }) => {
    const { user, permission } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/permissions/${permission.id}`)
      .bearerToken(token);

    const responseBody = response.body();

    assert.equal(permission.id, responseBody.id);
  });

  test('should create a permission', async ({ client, assert }) => {
    const { user, screen } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/permissions')
      .json({
        description: v4(),
        control: v4(),
        screenId: screen.id,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('update permission', async ({ client, assert }) => {
    const { user, permission, screen } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/permissions/${permission.id}`)
      .json({
        description: v4(),
        control: v4(),
        screenId: screen.id,
      })
      .bearerToken(token);

    const updatedPermission = response.body();

    assert.equal(permission.id, updatedPermission.id);
  });

  test('should delete a permission', async ({ client, assert }) => {
    const { user, permission } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/permissions/${permission.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
