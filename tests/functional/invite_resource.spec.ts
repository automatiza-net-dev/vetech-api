import Mail from '@ioc:Adonis/Addons/Mail';
import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { DEFAULT_USER_NAME } from 'App/Services/InviteService';
import UserFactory from 'Database/factories/UserFactory';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Invite resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, role } = await userBootstrap();

    const fakeUser = await UserFactory.create();
    const invite = await business.related('invites').create({
      id: v4(),
      email: fakeUser.email,
      role_id: role.id,
      active: true,
    });

    return { user, business, role, invite };
  };

  test('should return a list of invites', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/invites`).bearerToken(token);

    response.assertStatus(200);
    assert.isArray(response.body());
  });

  test('should throw BadRequestException if user already have related role', async ({
    assert,
    client,
  }) => {
    const { user, business, role } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/invites')
      .json({
        business_unit_id: business.id,
        role_id: role.id,
        email: user.email,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(400, response.status());
    assert.equal(
      'E_BAD_REQUEST: Convite já existe para o usuário/cargo',
      body.message,
    );
  });

  test('should send email to new user', async ({ assert, client }) => {
    const mailer = Mail.fake();

    const { user, business, role } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/invites')
      .json({
        business_unit_id: business.id,
        role_id: role.id,
        email: `${v4()}@mail.com`,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
    assert.isTrue(
      mailer.exists(mail => {
        return mail.subject === 'Convite - Vetech';
      }),
    );

    Mail.restore();
  });

  test('should return ResourceNotFoundException if invite does not exists', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/invites/${v4()}`).bearerToken(token);

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Convite não existe', response.body().message);
  });

  test('should return invite', async ({ client, assert }) => {
    const { user, invite } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/invites/${invite.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should return false for not completly registered user', async ({
    client,
    assert,
  }) => {
    const { user, business, role } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const fakeUser = await UserFactory.create();
    await fakeUser.merge({ name: DEFAULT_USER_NAME }).save();

    const invite = await business.related('invites').create({
      id: v4(),
      email: fakeUser.email,
      role_id: role.id,
    });

    const response = await client
      .get(`/invites/check/${invite.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(false, response.body().user);
  });

  test('should return true for already registered user', async ({
    client,
    assert,
  }) => {
    const { user, business, role } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const fakeUser = await UserFactory.create();
    const invite = await business.related('invites').create({
      id: v4(),
      email: fakeUser.email,
      role_id: role.id,
    });

    const response = await client
      .get(`/invites/check/${invite.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(true, response.body().user);
  });

  test('should return correct invite status', async ({ client, assert }) => {
    const { user, invite } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/invites/check/${invite.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.equal(invite.active, response.body().active);
  });

  test('should throw UnauthorizedException when updating not active invite', async ({
    client,
    assert,
  }) => {
    const { user, invite, business, role } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    await invite.merge({ active: false }).save();

    const response = await client
      .put(`/invites/${invite.id}`)
      .json({
        business_unit_id: business.id,
        role_id: role.id,
        email: `${v4()}@mail.com`,
      })
      .bearerToken(token);

    assert.equal(401, response.status());
    assert.equal(
      'E_NOT_AUTHORIZED: Convite não está mais ativo',
      response.body().message,
    );
  });

  // test('should throw BadRequestException if user has updating role', async ({
  //   client,
  //   assert,
  // }) => {
  //   const { user, invite, business, role } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const fakeUser = await UserFactory.create();
  //   const fakeRole = await RoleFactory.create();
  //   await fakeUser.related('roles').create({
  //     role_id: role.id,
  //     unit_id: business.id,
  //     active: false,
  //   });

  //   const response = await client
  //     .put(`/invites/${invite.id}`)
  //     .json({
  //       business_unit_id: business.id,
  //       role_id: fakeRole.id,
  //       email: fakeUser.email,
  //     })
  //     .bearerToken(token);

  //   assert.equal(401, response.status());
  //   assert.equal(
  //     'E_NOT_AUTHORIZED: Convite não está mais ativo',
  //     response.body().message,
  //   );
  // });

  // test('should send email to new user', async ({ assert, client }) => {
  //   const mailer = Mail.fake();

  //   const { user, business, role } = await createData();
  //   const token = await generateJwtToken(client, {
  //     email: user.email,
  //     password: '102030',
  //   });

  //   const response = await client
  //     .post('/invites')
  //     .json({
  //       business_unit_id: business.id,
  //       role_id: role.id,
  //       email: `${v4()}@mail.com`,
  //     })
  //     .bearerToken(token);

  //   assert.equal(201, response.status());
  //   assert.isTrue(
  //     mailer.exists(mail => {
  //       return mail.subject === 'Convite - Vetech';
  //     }),
  //   );

  //   Mail.restore();
  // });
});
