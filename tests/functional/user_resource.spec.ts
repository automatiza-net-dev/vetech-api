import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import User from 'App/Models/User';
import UserFactory from 'Database/factories/UserFactory';
import { v4 } from 'uuid';

/*
  REFACTOR LIST

  - check group creation after user creation
  - seed interaction (create user on demand?)

 */
test.group('User resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createUser = async (): Promise<[User]> => {
    const user = await UserFactory.create();

    return [user];
  };

  test('should return a list of all users', async ({ client, assert }) => {
    const response = await client.get('/users');

    const users = response.body();

    assert.isArray(users);
  });

  test('should throw not found exception if no user was found', async ({
    client,
    assert,
  }) => {
    const response = await client.get(`/users/${v4()}`);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: The user was not found', body.message as string);
  });

  test('should return the found user', async ({ client, assert }) => {
    const user = await UserFactory.create();

    const response = await client.get(`/users/${user.id}`);

    assert.equal(user.id, response.body().id);
  });

  test('update the user', async ({ client, assert }) => {
    const [user] = await createUser();

    const response = await client
      .put(`/users`)
      .json({
        document: '0987',
      })
      .loginAs(user);

    assert.equal('0987', response.body().document);
  });

  test('soft delete a user', async ({ client, assert }) => {
    const [user] = await createUser();

    const deleteResponse = await client.delete(`/users`).loginAs(user);

    assert.equal(204, deleteResponse.status());

    const getResponse = await client.get(`/users/${user.id}`);
    const body = getResponse.body();
    assert.equal('E_NOT_FOUND: The user was not found', body.message as string);
  });
});
