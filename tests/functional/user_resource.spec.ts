import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import User from 'App/Models/User';
import { v4 } from 'uuid';

test.group('User resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  test('should return a list of all users', async ({ client, assert }) => {
    const response = await client.get('/users');

    const [user] = response.body() as Array<User>;

    assert.equal('mail@mail.com', user.email);
    assert.equal('123456789', user.document);
    assert.notEqual('102030', user.password);
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

    assert.equal('user1', response.body().name);
  });

  test('soft delete a user', async ({ client, assert }) => {
    const [user] = await User.all();

    const deleteResponse = await client.delete(`/users/${user.id}`);
    assert.equal(204, deleteResponse.status());

    const getResponse = await client.get(`/users/${user.id}`);
    const body = getResponse.body();
    assert.equal('E_NOT_FOUND: The user was not found', body.message as string);
  });
});
