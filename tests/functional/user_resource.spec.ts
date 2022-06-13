import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import User from 'App/Models/User';

test.group('User resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  test('should a list of all users', async ({ client, assert }) => {
    const response = await client.get('/users');

    const [user] = response.body() as Array<User>;

    assert.equal('mail@mail.com', user.email);
    assert.equal('123456789', user.document);
    assert.notEqual('102030', user.password);
  });
});
