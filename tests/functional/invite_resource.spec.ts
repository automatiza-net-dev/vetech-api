import Mail from '@ioc:Adonis/Addons/Mail';
import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import Invite from 'App/Models/Invite';
import Role from 'App/Models/Role';
import User from 'App/Models/User';
import UserFactory from 'Database/factories/UserFactory';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Invite resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<[User, BusinessUnit, Role, Invite]> => {
    const { user, business, role } = await userBootstrap();

    const invite = await business.related('invites').create({
      id: v4(),
      email: 'mail@mail.com',
      role_id: role.id,
    });

    return [user, business, role, invite];
  };

  const createSudo = async (): Promise<[Role]> => {
    const role = await Role.firstOrCreate({ name: 'super-admin' }, {});

    return [role];
  };

  test('should throw UnauthorizedException if invalid business unit', async ({
    assert,
    client,
  }) => {
    const [_, businessUnit, role] = await createData();
    const user2 = await UserFactory.create();

    const response = await client
      .post('/invites')
      .json({
        business_unit_id: businessUnit.id,
        role_id: role.id,
        email: 'mail@mail.com',
      })
      .loginAs(user2);

    const body = response.body();

    assert.equal(401, response.status());
    assert.equal('E_NOT_AUTHORIZED: Ação não permitida', body.message);
  });

  test('should send email to new user', async ({ assert, client }) => {
    const mailer = Mail.fake();

    const [user, businessUnit, role] = await createData();

    const response = await client
      .post('/invites')
      .json({
        business_unit_id: businessUnit.id,
        role_id: role.id,
        email: `${v4()}@mail.com`,
      })
      .loginAs(user);

    const body = response.body();

    assert.equal(201, response.status());
    assert.isUndefined(body.user_id);
    assert.isTrue(
      mailer.exists(mail => {
        return mail.subject === 'Convite - Vetech';
      }),
    );

    Mail.restore();
  });

  test('should send email to existing user', async ({ assert, client }) => {
    const mailer = Mail.fake();

    const [user, businessUnit, role] = await createData();
    const user2 = await UserFactory.create();

    const response = await client
      .post('/invites')
      .json({
        business_unit_id: businessUnit.id,
        role_id: role.id,
        email: user2.email,
      })
      .loginAs(user);

    const body = response.body();

    assert.equal(201, response.status());
    assert.equal(user2.id, body.user_id);
    assert.isTrue(
      mailer.exists(mail => {
        return mail.subject === 'Convite - Vetech';
      }),
    );

    Mail.restore();
  });

  test('should throw UnauthorizedException if invite is not active', async ({
    assert,
    client,
  }) => {
    const [user, businessUnit, role, invite] = await createData();
    const user2 = await UserFactory.create();
    await invite.merge({ active: false }).save();

    const response = await client
      .put(`/invites/${invite.id}`)
      .json({
        business_unit_id: businessUnit.id,
        role_id: role.id,
        email: user2.email,
      })
      .loginAs(user);

    const body = response.body();

    assert.equal(401, response.status());
    assert.equal('E_NOT_AUTHORIZED: Convite não está mais ativo', body.message);
  });

  test('should update invite', async ({ assert, client }) => {
    const mailer = Mail.fake();

    const [user, businessUnit, role, invite] = await createData();
    const user2 = await UserFactory.create();

    const response = await client
      .put(`/invites/${invite.id}`)
      .json({
        business_unit_id: businessUnit.id,
        role_id: role.id,
        email: user2.email,
      })
      .loginAs(user);

    assert.equal(200, response.status());
    assert.isTrue(
      mailer.exists(mail => {
        return mail.subject === 'Convite - Vetech';
      }),
    );

    Mail.restore();
  });

  test('should return invite for given id', async ({ assert, client }) => {
    const [_, __, ___, invite] = await createData();

    const response = await client.get(`/invites/${invite.id}`);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(invite.id, body.id);
  });

  test('should throw NotFoundException if no invite was found', async ({
    assert,
    client,
  }) => {
    const response = await client.get(`/invites/${v4()}`);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Convite não existe', body.message);
  });

  test('should throw exception for unauthorized delete request', async ({
    assert,
    client,
  }) => {
    const [_, __, ___, invite] = await createData();
    const [user] = await createData();

    const response = await client.delete(`/invites/${invite.id}`).loginAs(user);

    const body = response.body();

    assert.equal(401, response.status());
    assert.equal('E_NOT_AUTHORIZED: Ação não permitida', body.message);
  });

  test('should soft delete a invite', async ({ assert, client }) => {
    const [user, __, ___, invite] = await createData();

    const response = await client.delete(`/invites/${invite.id}`).loginAs(user);

    assert.equal(204, response.status());
  });

  test('should check invite status', async ({ assert, client }) => {
    const [user, __, ___, invite] = await createData();
    await invite
      .merge({
        user_id: user.id,
      })
      .save();

    const response = await client.get(`/invites/check/${invite.id}`);

    const { active, user: hasUser } = response.body();

    assert.equal(200, response.status());
    assert.isTrue(active);
    assert.isTrue(hasUser);
  });

  test('should check invite status with no user', async ({
    assert,
    client,
  }) => {
    const [_, __, ___, invite] = await createData();
    const response = await client.get(`/invites/check/${invite.id}`);

    const { active, user: hasUser } = response.body();

    assert.equal(200, response.status());
    assert.isTrue(active);
    assert.isFalse(hasUser);
  });

  test('should throw BadRequestException if invite is not active', async ({
    assert,
    client,
  }) => {
    const [_, __, ___, invite] = await createData();
    await invite.merge({ active: false }).save();

    const response = await client.post(`/invites/accept-invite`).json({
      id: invite.id,
    });

    const { message } = response.body();

    assert.equal(400, response.status());
    assert.equal('E_BAD_REQUEST: Convite não está mais ativo', message);
  });

  test('should use invite', async ({ assert, client }) => {
    const [_, __, ___, invite] = await createData();
    const user = await UserFactory.create();
    await invite.merge({ email: user.email }).save();
    const oldRoles = await user.related('roles').query();

    const response = await client.post(`/invites/accept-invite`).json({
      id: invite.id,
    });

    const newRoles = await user.related('roles').query();

    assert.equal(204, response.status());
    assert.notEqual(oldRoles.length, newRoles.length);
  });

  test('should use invite when creating new user', async ({
    assert,
    client,
  }) => {
    const [_, __, ___, invite] = await createData();
    const email = `${v4()}@mail.com`;
    await invite.merge({ email }).save();

    const response = await client.post(`/invites/accept-invite-new-user`).json({
      id: invite.id,
      name: 'user',
      password: '102030',
      password_confirmation: '102030',
    });

    const user = await User.findByOrFail('email', email);
    const newRoles = await user.related('roles').query();

    assert.equal(204, response.status());
    assert.equal(1, newRoles.length);
  });

  test('should return all invites for super admin', async ({
    assert,
    client,
  }) => {
    const [user, businessUnit] = await createData();
    const [sudoRole] = await createSudo();
    await user.related('roles').create({
      role_id: sudoRole.id,
      unit_id: businessUnit.id,
    });

    const response = await client.get(`/invites`).loginAs(user);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
  });

  test('should return all invites for business unit', async ({
    assert,
    client,
  }) => {
    const [user, _, __, invite] = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/invites`).bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());

    assert.lengthOf(body, 1);
    assert.equal(invite.id, body[0].id);
  });
});
