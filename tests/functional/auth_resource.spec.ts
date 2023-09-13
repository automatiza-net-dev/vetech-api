import Mail from '@ioc:Adonis/Addons/Mail';
import Encryption from '@ioc:Adonis/Core/Encryption';
import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { LicenceType } from 'App/Models/Licence';
import UserPasswordChange from 'App/Models/UserPasswordChange';
import RoleFactory from 'Database/factories/RoleFactory';
import { addDays } from 'date-fns';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Auth resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createUser = async ({
    activeLicence = true,
    expiration,
    licenceType = LicenceType.PAY,
    system_name = 'SUT',
  }: {
    activeLicence?: boolean;
    expiration?: Date;
    licenceType?: LicenceType;
    system_name?: string;
  }) => {
    const { user, group, business, licence, role, system } =
      await userBootstrap(system_name);
    await licence.delete();

    const newLicence = await business.related('licences').create({
      id: v4(),
      expirationDate: expiration ?? addDays(new Date(), 7),
      type: licenceType,
      active: activeLicence,
    });

    return { user, business, group, newLicence, role, system };
  };

  // test('should return authenticated user', async ({ client, assert }) => {
  //   const [user] = await createUser({});
  //   const response = await client.get('/auth/me').loginAs(user);
  //
  //   const loggedUser = response.body();
  //
  //   assert.equal(user.id, loggedUser.user.id);
  // });

  test('should throw BadRequestException if swapping for a wrong unit', async ({
    client,
    assert,
  }) => {
    const { user } = await createUser({});
    const { business } = await createUser({});
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/auth/swap-unit`)
      .json({
        unitId: business.id,
      })
      .bearerToken(token);

    assert.equal(400, response.status());
  });

  test('should return new token with swapped unit', async ({
    client,
    assert,
  }) => {
    const { user, business } = await createUser({});
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/auth/swap-unit`)
      .json({
        unitId: business.id,
      })
      .bearerToken(token);

    assert.equal(204, response.status());
  });

  test('should login a new user', async ({ client, assert }) => {
    const { user, business } = await createUser({});

    const response = await client.post(`/auth/login`).json({
      email: user.email,
      password: '102030',
      business_unit_id: business.id,
      system: 'SUT',
    });

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal('bearer', body.type);
  });

  test('should return error for invalid login/system', async ({
    client,
    assert,
  }) => {
    const { business } = await createUser({});
    const { user } = await createUser({
      system_name: 'SUT2',
    });

    const response = await client.post(`/auth/login`).json({
      email: user.email,
      password: '102030',
      business_unit_id: business.id,
      system: 'SUT',
    });

    assert.equal(400, response.status());
  });

  test('should return a list of units if no unit is sent having more than one unit', async ({
    client,
    assert,
  }) => {
    const { user, group } = await createUser({});
    const role = await RoleFactory.create();
    const unit = await group.related('businessUnits').create({
      id: v4(),
      document: user.document,
      phone: user.phone,
      email: user.email,
      origin: 'TESTING',
    });
    await user.related('roles').create({
      role_id: role.id,
      unit_id: unit.id,
    });

    const response = await client.post(`/auth/login`).json({
      email: user.email,
      password: '102030',
      system: 'SUT',
    });

    assert.equal(200, response.status());
  });

  test('should return 400 on bad login credentials', async ({
    client,
    assert,
  }) => {
    const { user } = await createUser({});

    const response = await client.post(`/auth/login`).json({
      email: user.email,
      password: 'bad-password',
      system: 'SUT',
    });

    assert.equal(400, response.status());
  });

  test('should login controller', async ({ client, assert }) => {
    const { user, business, role } = await createUser({});

    await role.merge({ type: 'controller' }).save();
    await user.merge({ type: 'controller' }).save();

    const response = await client.post(`/auth/controller-login`).json({
      email: user.email,
      password: '102030',
      business_unit_id: business.id,
      system: 'SUT',
    });

    assert.equal(200, response.status());
  });

  test('should return BadRequestException if role is not controller', async ({
    client,
    assert,
  }) => {
    const { user, business } = await createUser({});

    await user.merge({ type: 'controller' }).save();

    const response = await client.post(`/auth/controller-login`).json({
      email: user.email,
      password: '102030',
      business_unit_id: business.id,
      system: 'SUT',
    });

    assert.equal(400, response.status());
  });

  test('should return BadRequestException if user is not controller', async ({
    client,
    assert,
  }) => {
    const { user, business } = await createUser({});

    const response = await client.post(`/auth/controller-login`).json({
      email: user.email,
      password: '102030',
      business_unit_id: business.id,
      system: 'SUT',
    });

    assert.equal(400, response.status());
  });

  // test('should register a new user', async ({ client, assert }) => {
  //   await createUser({});
  //
  //   const response = await client.post(`/auth/register`).json({
  //     name: 'user1',
  //     email: 'mail10@mail.com',
  //     password: '102030',
  //     password_confirmation: '102030',
  //     document: '0987',
  //     licensingJob: '1234',
  //
  //     systemName: 'SUT',
  //   });
  //
  //   const body = response.body();
  //
  //   assert.equal(201, response.status());
  //   assert.equal('bearer', body.type);
  // });
  //
  // test('should register a new user (LiftOne)', async ({ client, assert }) => {
  //   await createUser({
  //     system_name: 'LiftOne',
  //   });
  //
  //   const response = await client.post(`/auth/register`).json({
  //     name: 'user1',
  //     email: 'mail10@mail.com',
  //     password: '102030',
  //     password_confirmation: '102030',
  //     document: '0987',
  //     licensingJob: '1234',
  //
  //     systemName: 'LiftOne',
  //   });
  //
  //   const body = response.body();
  //
  //   assert.equal(201, response.status());
  //   assert.equal('bearer', body.type);
  // });
  //
  // test('should register a new user (Sanclá)', async ({ client, assert }) => {
  //   await createUser({
  //     system_name: 'Sanclá',
  //   });
  //
  //   const response = await client.post(`/auth/register`).json({
  //     name: 'user1',
  //     email: 'mail10@mail.com',
  //     password: '102030',
  //     password_confirmation: '102030',
  //     document: '0987',
  //     licensingJob: '1234',
  //
  //     systemName: 'Sanclá',
  //   });
  //
  //   const body = response.body();
  //
  //   assert.equal(201, response.status());
  //   assert.equal('bearer', body.type);
  // });
  //
  // test('should register a new user (Vetech)', async ({ client, assert }) => {
  //   await createUser({
  //     system_name: 'Vetech',
  //   });
  //
  //   const response = await client.post(`/auth/register`).json({
  //     name: 'user1',
  //     email: 'mail10@mail.com',
  //     password: '102030',
  //     password_confirmation: '102030',
  //     document: '0987',
  //     licensingJob: '1234',
  //
  //     systemName: 'Vetech',
  //   });
  //
  //   const body = response.body();
  //
  //   assert.equal(201, response.status());
  //   assert.equal('bearer', body.type);
  // });

  test('should handle forgot password', async ({ client, assert }) => {
    const { user, system } = await createUser({});
    const mailer = Mail.fake();

    const response = await client.post(`/auth/forgot-password`).json({
      email: user.email,
      systemName: system.name,
    });

    assert.equal(204, response.status());
    assert.isTrue(
      mailer.exists(mail => mail.subject === 'Recuperação de Senha'),
    );

    Mail.restore();
  });

  test('should throw error on invalid hash', async ({ client, assert }) => {
    const { user } = await createUser({});
    const hash = Encryption.encrypt('invalid@mail.com', '30min');

    const response = await client.post(`/auth/reset-password`).json({
      email: user.email,
      password: '102030',
      password_confirmation: '102030',
      hash,
    });

    assert.equal(400, response.status());
  });

  test('should handle reset password', async ({ client, assert }) => {
    const { user } = await createUser({});
    const hash = Encryption.encrypt(user.email, '30min');

    await UserPasswordChange.create({
      system_id: user.system_id,
      user_id: user.id,
      hash,
      expiresAt: DateTime.now().plus({ hour: 1 }),
      type: 'sut',
    });

    const response = await client.post(`/auth/reset-password`).json({
      email: user.email,
      password: '102030',
      password_confirmation: '102030',
      hash,
    });

    assert.equal(204, response.status());
  });

  // test('should return 400 on no licence on unit', async ({
  //   client,
  //   assert,
  // }) => {
  //   const [user, unit] = await createUser({ activeLicence: false });

  //   const response = await client.post(`/auth/login`).json({
  //     email: user.email,
  //     password: '102030',
  //     business_unit_id: unit.id,
  //     system: 'SUT',
  //   });

  //   const body = response.body();

  //   assert.equal(400, response.status());
  //   assert.isTrue(body.message.startsWith('E_NO_LICENCE'));
  // });

  // test('should return 400 on expired trial licence', async ({
  //   client,
  //   assert,
  // }) => {
  //   const [user, unit] = await createUser({
  //     expiration: new Date('2022-06-01'),
  //     licenceType: LicenceType.TRIAL,
  //   });

  //   const response = await client.post(`/auth/login`).json({
  //     email: user.email,
  //     password: '102030',
  //     business_unit_id: unit.id,
  //     system: 'SUT',
  //   });

  //   const body = response.body();

  //   assert.equal(400, response.status());
  //   assert.isTrue(body.message.startsWith('E_EXPIRED_TRIAL'));
  // });

  // test('should return 400 on expired additional trial licence', async ({
  //   client,
  //   assert,
  // }) => {
  //   const [user, unit] = await createUser({
  //     expiration: new Date('2022-06-01'),
  //     licenceType: LicenceType.ADDITIONAL_TRIAL,
  //   });

  //   const response = await client.post(`/auth/login`).json({
  //     email: user.email,
  //     password: '102030',
  //     business_unit_id: unit.id,
  //     system: 'SUT',
  //   });

  //   const body = response.body();

  //   assert.equal(400, response.status());
  //   assert.isTrue(body.message.startsWith('E_EXPIRED_ADDITIONAL_TRIAL'));
  // });

  // test('should return 400 on expired paid licence', async ({
  //   client,
  //   assert,
  // }) => {
  //   const [user, unit] = await createUser({
  //     expiration: new Date('2022-06-01'),
  //     licenceType: LicenceType.PAY,
  //   });

  //   const response = await client.post(`/auth/login`).json({
  //     email: user.email,
  //     password: '102030',
  //     business_unit_id: unit.id,
  //     system: 'SUT',
  //   });

  //   const body = response.body();

  //   assert.equal(400, response.status());
  //   assert.isTrue(body.message.startsWith('E_EXPIRED_LICENCE'));
  // });
});
