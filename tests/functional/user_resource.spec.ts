import Encryption from '@ioc:Adonis/Core/Encryption';
import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import User from 'App/Models/User';
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

  test('return the found user', async ({ client, assert }) => {
    const [user] = await User.all();

    const response = await client.get(`/users/${user.id}`);

    assert.equal(user.id, response.body().id);
  });

  test('update the user', async ({ client, assert }) => {
    const [user] = await User.all();

    const response = await client.put(`/users/${user.id}`).json({
      document: '0987',
    });

    assert.equal('0987', response.body().document);
  });

  test('create a new user', async ({ client, assert }) => {
    const response = await client.post(`/users`).json({
      name: 'user1',
      email: 'mail10@mail.com',
      password: '102030',
      password_confirmation: '102030',
      document: '0987',
    });

    assert.equal(201, response.status());
  });

  test('soft delete a user', async ({ client, assert }) => {
    const [user] = await User.all();

    const deleteResponse = await client.delete(`/users/${user.id}`);
    assert.equal(204, deleteResponse.status());

    const getResponse = await client.get(`/users/${user.id}`);
    const body = getResponse.body();
    assert.equal('E_NOT_FOUND: The user was not found', body.message as string);
  });

  test('forgot password', async ({ client, assert }) => {
    const [user] = await User.all();

    const response = await client.post(`/users/forgot-password`).json({
      email: user.email,
    });
    assert.equal(204, response.status());
    // TODO assert email was sent
  });

  test('throw error on invalid hash', async ({ client, assert }) => {
    const [user] = await User.all();
    const hash = Encryption.encrypt('invalid@mail.com', '30min');

    const response = await client.post(`/users/reset-password`).json({
      email: user.email,
      password: '102030',
      password_confirmation: '102030',
      hash,
    });

    assert.equal(400, response.status());
    assert.equal(
      'E_UNAUTHORIZED: Token inválido',
      response.body().message as string,
    );
  });

  test('reset password', async ({ client, assert }) => {
    const [user] = await User.all();
    const hash = Encryption.encrypt(user.email, '30min');

    const response = await client.post(`/users/reset-password`).json({
      email: user.email,
      password: '102030',
      password_confirmation: '102030',
      hash,
    });

    assert.equal(204, response.status());
  });
});
