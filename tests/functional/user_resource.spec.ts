import Mail from '@ioc:Adonis/Addons/Mail';
import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import User from 'App/Models/User';
import ConfirmationToken from 'App/Models/ConfirmationToken';
import UserPasswordChange from 'App/Models/UserPasswordChange';
import UserFactory from 'Database/factories/UserFactory';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { userBootstrap, generateJwtToken } from '../utils';

test.group('User resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createUser = async () => {
    return userBootstrap();
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
    const { user } = await createUser();

    const response = await client
      .put(`/users`)
      .json({
        document: '0987',
        licensingJob: '1234',
        inscription: '1234',
        birthDate: DateTime.local().toISO(),
      })
      .loginAs(user);

    assert.equal('0987', response.body().document);
  });

  test('soft delete a user', async ({ client, assert }) => {
    const { user } = await createUser();

    const deleteResponse = await client.delete(`/users`).loginAs(user);

    assert.equal(204, deleteResponse.status());

    const getResponse = await client.get(`/users/${user.id}`);
    const body = getResponse.body();
    assert.equal('E_NOT_FOUND: The user was not found', body.message as string);
  });

  test('should return existing false for no email in database', async ({
    client,
    assert,
  }) => {
    const response = await client.get(`/users/check-email/invalid-email`);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isFalse(body.exists);
  });

  test('should return existing true for email in database but false for existing token', async ({
    client,
    assert,
  }) => {
    const { user } = await createUser();
    const response = await client.get(`/users/check-email/${user.email}`);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(body.exists);
    assert.isFalse(body.has_token);
  });

  test('should return existing true for email in database and true for existing token', async ({
    client,
    assert,
  }) => {
    const { user } = await createUser();
    await ConfirmationToken.create({
      email: user.email,
      code: '0001',
      expiresAt: DateTime.now().plus({ days: 1 }),
    });
    const response = await client.get(`/users/check-email/${user.email}`);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(body.exists);
    assert.isTrue(body.has_token);
  });

  test('should send confirmation token', async ({ client, assert }) => {
    const mailer = Mail.fake();

    const response = await client.post(`/users/send-confirmation`).json({
      email: 'some-email@mail.com',
      name: 'some name',
      phone: 'some phone',
    });

    assert.equal(204, response.status());
    assert.isTrue(
      mailer.exists(mail => {
        return mail.subject === 'Confirmação de email';
      }),
    );

    Mail.restore();
  });

  test('should throw BadRequestException for no matching code-email', async ({
    client,
    assert,
  }) => {
    const token1 = await ConfirmationToken.create({
      email: 'user1@mail.com',
      code: '0001',
      expiresAt: DateTime.now().plus({ days: 1 }),
    });
    const token2 = await ConfirmationToken.create({
      email: 'user2@mail.com',
      code: '0002',
      expiresAt: DateTime.now().plus({ days: 1 }),
    });

    const response = await client.post(`/users/confirm-token`).json({
      email: token1.email,
      code: token2.code,
    });

    assert.equal(400, response.status());
  });

  test('should throw BadRequestException for not active token', async ({
    client,
    assert,
  }) => {
    const token1 = await ConfirmationToken.create({
      email: 'user1@mail.com',
      code: '0001',
      expiresAt: DateTime.now().plus({ days: 1 }),
      active: false,
    });

    const response = await client.post(`/users/confirm-token`).json({
      email: token1.email,
      code: token1.code,
    });

    assert.equal(400, response.status());
  });

  test('should throw BadRequestException for expired token', async ({
    client,
    assert,
  }) => {
    const token1 = await ConfirmationToken.create({
      email: 'user1@mail.com',
      code: '0001',
      expiresAt: DateTime.now().minus({ days: 1 }),
    });

    const response = await client.post(`/users/confirm-token`).json({
      email: token1.email,
      code: token1.code,
    });

    assert.equal(400, response.status());
  });

  test('should confirm token', async ({ client, assert }) => {
    const token1 = await ConfirmationToken.create({
      email: 'user1@mail.com',
      code: '0001',
      expiresAt: DateTime.now().plus({ days: 1 }),
    });

    const response = await client.post(`/users/confirm-token`).json({
      email: token1.email,
      code: token1.code,
    });

    assert.equal(204, response.status());
  });

  test('should throw BadRequestException if email is already on platform', async ({
    client,
    assert,
  }) => {
    const { user } = await createUser();
    const response = await client.get(
      `/users/resend-confirmation/${user.email}`,
    );

    assert.equal(400, response.status());
  });

  test('should throw BadRequestException if no token was found', async ({
    client,
    assert,
  }) => {
    const response = await client.get(
      `/users/resend-confirmation/user1@mail.com`,
    );

    assert.equal(400, response.status());
  });

  test('should resend confirmation email', async ({ client, assert }) => {
    const mailer = Mail.fake();

    const token1 = await ConfirmationToken.create({
      email: 'user1@mail.com',
      code: '0001',
      expiresAt: DateTime.now().plus({ days: 1 }),
    });

    const response = await client.get(
      `/users/resend-confirmation/${token1.email}`,
    );

    assert.equal(204, response.status());
    assert.isTrue(
      mailer.exists(mail => {
        return mail.subject === 'Confirmação de email';
      }),
    );

    Mail.restore();
  });

  test('should return existing false for invalid document', async ({
    client,
    assert,
  }) => {
    const response = await client.get(`/users/check-document/invalid-email`);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isFalse(body.valid);
  });

  test('should return existing true for valid document and false for in usage', async ({
    client,
    assert,
  }) => {
    const response = await client.get(`/users/check-document/74069759000167`);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(body.valid);
    assert.isFalse(body.exists);
  });

  test('should return existing true for valid document and true for in usage', async ({
    client,
    assert,
  }) => {
    const { user } = await createUser();
    const response = await client.get(`/users/check-document/${user.document}`);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isTrue(body.valid);
    assert.isTrue(body.exists);
  });

  test('should throw BadRequestException if there is a active change password link', async ({
    client,
    assert,
  }) => {
    const { user, group, system, business } = await createUser();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
      systemName: system.name,
    });

    await UserPasswordChange.create({
      system_id: system.id,
      economic_group_id: group.id,
      business_unit_id: business.id,
      user_id: user.id,
      hash: '',
      expiresAt: DateTime.now().plus({ hour: 1 }),
    });

    const response = await client
      .post(`/users/start-change-password`)
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should send change password email', async ({ client, assert }) => {
    const mailer = Mail.fake();

    const { user, system } = await createUser();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
      systemName: system.name,
    });

    const response = await client
      .post(`/users/start-change-password`)
      .bearerToken(token);

    assert.equal(204, response.status());
    assert.isTrue(
      mailer.exists(mail => {
        return mail.subject === 'Troca de Senha';
      }),
    );

    Mail.restore();
  });

  test('should throw BadRequestException if hash does not belong to user', async ({
    client,
    assert,
  }) => {
    const { user, group, system, business } = await createUser();
    const { user: user2 } = await createUser();
    const token = await generateJwtToken(client, {
      email: user2.email,
      password: '102030',
      systemName: system.name,
    });

    await UserPasswordChange.create({
      system_id: system.id,
      economic_group_id: group.id,
      business_unit_id: business.id,
      user_id: user.id,
      hash: 'HASH',
      expiresAt: DateTime.now().plus({ hour: 1 }),
    });

    const response = await client
      .post(`/users/complete-change-password`)
      .json({
        hash: 'HASH',
        password: '102030',
        password_confirmation: '102030',
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should throw BadRequestException if hash is expired', async ({
    client,
    assert,
  }) => {
    const { user, group, system, business } = await createUser();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
      systemName: system.name,
    });

    await UserPasswordChange.create({
      system_id: system.id,
      economic_group_id: group.id,
      business_unit_id: business.id,
      user_id: user.id,
      hash: 'HASH',
      expiresAt: DateTime.now().minus({ hour: 1 }),
    });

    const response = await client
      .post(`/users/complete-change-password`)
      .json({
        hash: 'HASH',
        password: '102030',
        password_confirmation: '102030',
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should throw BadRequestException if hash is completed', async ({
    client,
    assert,
  }) => {
    const { user, group, system, business } = await createUser();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
      systemName: system.name,
    });

    await UserPasswordChange.create({
      system_id: system.id,
      economic_group_id: group.id,
      business_unit_id: business.id,
      user_id: user.id,
      hash: 'HASH',
      expiresAt: DateTime.now().plus({ hour: 1 }),
      completed: true,
    });

    const response = await client
      .post(`/users/complete-change-password`)
      .json({
        hash: 'HASH',
        password: '102030',
        password_confirmation: '102030',
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should complete password change', async ({ client, assert }) => {
    const { user, group, system, business } = await createUser();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
      systemName: system.name,
    });

    await UserPasswordChange.create({
      system_id: system.id,
      economic_group_id: group.id,
      business_unit_id: business.id,
      user_id: user.id,
      hash: 'HASH',
      expiresAt: DateTime.now().plus({ hour: 1 }),
    });

    const response = await client
      .post(`/users/complete-change-password`)
      .json({
        hash: 'HASH',
        password: '102030',
        password_confirmation: '102030',
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should create controller user', async ({ client, assert }) => {
    const { user, system, business, role } = await createUser();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
      systemName: system.name,
    });

    const response = await client
      .post(`/users/create-user-controller`)
      .json({
        name: 'User Controller',
        email: `${v4()}@mail.com`,
        document: '102030',
        password: '102030',
        units: [{ businessUnitId: business.id, roleId: role.id }],
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should update controller user', async ({ client, assert }) => {
    const { user, system, business, role } = await createUser();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
      systemName: system.name,
    });

    const otherUser = await User.create({
      system_id: system.id,
      name: 'User Controller',
      email: `${v4()}@mail.com`,
      document: '102030',
      password: '102030',
    });

    const response = await client
      .post(`/users/update-user-controller`)
      .json({
        id: otherUser.id,
        name: 'User Controller',
        email: `${v4()}@mail.com`,
        document: '102030',
        password: '102030',
        units: [{ businessUnitId: business.id, roleId: role.id }],
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should fetch user controllers', async ({ client, assert }) => {
    const { user, system, business, role } = await createUser();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
      systemName: system.name,
    });

    const otherUser = await User.create({
      system_id: system.id,
      name: 'User Controller',
      email: `${v4()}@mail.com`,
      document: '102030',
      password: '102030',
    });

    await otherUser.related('roles').create({
      role_id: role.id,
      unit_id: business.id,
    });

    const response = await client
      .get(`/users/fetch-user-controllers`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });
});
