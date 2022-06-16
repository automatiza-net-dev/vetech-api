import Mail from '@ioc:Adonis/Addons/Mail';
import Encryption from '@ioc:Adonis/Core/Encryption';
import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import User from 'App/Models/User';
import UserFactory from 'Database/factories/UserFactory';

test.group('Auth resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createUser = async (): Promise<[User]> => {
    const user = await UserFactory.create();

    return [user];
  };

  test('should return authenticated user', async ({ client, assert }) => {
    const [user] = await createUser();
    const response = await client.get('/auth/me').guard('api').loginAs(user);

    const loggedUser = response.body();

    assert.equal(user.id, loggedUser.id);
  });

  test('register a new user', async ({ client, assert }) => {
    const response = await client.post(`/auth/register`).json({
      name: 'user1',
      email: 'mail10@mail.com',
      password: '102030',
      password_confirmation: '102030',
      document: '0987',
    });

    assert.equal(201, response.status());
  });

  test('forgot password', async ({ client, assert }) => {
    const [user] = await User.all();
    const mailer = Mail.fake();

    const response = await client.post(`/auth/forgot-password`).json({
      email: user.email,
    });

    assert.equal(204, response.status());
    assert.isTrue(
      mailer.exists(mail => mail.subject === 'Recuperação de Senha'),
    );

    Mail.restore();
  });

  test('throw error on invalid hash', async ({ client, assert }) => {
    const [user] = await User.all();
    const hash = Encryption.encrypt('invalid@mail.com', '30min');

    const response = await client.post(`/auth/reset-password`).json({
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

    const response = await client.post(`/auth/reset-password`).json({
      email: user.email,
      password: '102030',
      password_confirmation: '102030',
      hash,
    });

    assert.equal(204, response.status());
  });
});
