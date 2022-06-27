import Mail from '@ioc:Adonis/Addons/Mail';
import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import Invite from 'App/Models/Invite';
import Role from 'App/Models/Role';
import User from 'App/Models/User';
import RoleFactory from 'Database/factories/RoleFactory';
import UserFactory from 'Database/factories/UserFactory';
import { v4 } from 'uuid';

test.group('Invoice resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<[User, BusinessUnit, Role, Invite]> => {
    const user = await UserFactory.create();
    const newGroup = await user.related('economicGroups').create({
      id: v4(),
      document: user.document,
      responsibleEmail: user.email,
      responsiblePhone: user.phone,
    });

    const newBusinessUnit = await newGroup.related('businessUnits').create({
      id: v4(),
      document: user.document,
      phone: user.phone,
      email: user.email,
      origin: 'TESTING',
    });

    const role = await RoleFactory.create();

    const invite = await newBusinessUnit.related('invites').create({
      id: v4(),
      email: 'mail@mail.com',
      role_id: role.id,
    });

    return [user, newBusinessUnit, role, invite];
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
});
