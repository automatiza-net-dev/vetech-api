import Mail from '@ioc:Adonis/Addons/Mail';
import Encryption from '@ioc:Adonis/Core/Encryption';
import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import Licence, { LicenceType } from 'App/Models/Licence';
import User from 'App/Models/User';
import { addDays } from 'date-fns';
import { v4 } from 'uuid';

import { userBootstrap } from '../utils';

test.group('Auth resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createUser = async ({
    activeLicence = true,
    expiration,
    licenceType = LicenceType.PAY,
  }: {
    activeLicence?: boolean;
    expiration?: Date;
    licenceType?: LicenceType;
  }): Promise<[User, BusinessUnit, EconomicGroup, Licence]> => {
    const { user, group, business, licence } = await userBootstrap();
    await licence.delete();

    const newLicence = await business.related('licences').create({
      id: v4(),
      expirationDate: expiration ?? addDays(new Date(), 7),
      type: licenceType,
      active: activeLicence,
    });

    return [user, business, group, newLicence];
  };

  test('should return authenticated user', async ({ client, assert }) => {
    const [user] = await createUser({});
    const response = await client.get('/auth/me').loginAs(user);

    const loggedUser = response.body();

    assert.equal(user.id, loggedUser.user.id);
  });

  test('login a new user', async ({ client, assert }) => {
    const [user, unit] = await createUser({});

    const response = await client.post(`/auth/login`).json({
      email: user.email,
      password: '102030',
      business_unit_id: unit.id,
    });

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal('bearer', body.type);
  });

  test('should return a list of units if no unit is sent having more than one unit', async ({
    client,
    assert,
  }) => {
    const [user, unit, group] = await createUser({});
    await group.related('businessUnits').create({
      id: v4(),
      document: user.document,
      phone: user.phone,
      email: user.email,
      origin: 'TESTING',
    });

    const response = await client.post(`/auth/login`).json({
      email: user.email,
      password: '102030',
    });

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.equal(unit.id, body[0].id);
  });

  test('should return 400 on bad login credentials', async ({
    client,
    assert,
  }) => {
    const [user] = await createUser({});

    const response = await client.post(`/auth/login`).json({
      email: user.email,
      password: 'bad-password',
    });

    assert.equal(400, response.status());
  });

  test('register a new user', async ({ client, assert }) => {
    const response = await client.post(`/auth/register`).json({
      name: 'user1',
      email: 'mail10@mail.com',
      password: '102030',
      password_confirmation: '102030',
      document: '0987',
    });

    const body = response.body();

    assert.equal(201, response.status());
    assert.equal('bearer', body.type);
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

  test('should return 400 on no licence on unit', async ({
    client,
    assert,
  }) => {
    const [user, unit] = await createUser({ activeLicence: false });

    const response = await client.post(`/auth/login`).json({
      email: user.email,
      password: '102030',
      business_unit_id: unit.id,
    });

    const body = response.body();

    assert.equal(400, response.status());
    assert.equal('E_NO_LICENCE: Clínica não tem licença ativa', body.message);
  });

  test('should return 400 on expired trial licence', async ({
    client,
    assert,
  }) => {
    const [user, unit] = await createUser({
      expiration: new Date('2022-06-01'),
      licenceType: LicenceType.TRIAL,
    });

    const response = await client.post(`/auth/login`).json({
      email: user.email,
      password: '102030',
      business_unit_id: unit.id,
    });

    const body = response.body();

    assert.equal(400, response.status());
    assert.equal('E_EXPIRED_TRIAL: Licença de teste já expirou', body.message);
  });

  test('should return 400 on expired additional trial licence', async ({
    client,
    assert,
  }) => {
    const [user, unit] = await createUser({
      expiration: new Date('2022-06-01'),
      licenceType: LicenceType.ADDITIONAL_TRIAL,
    });

    const response = await client.post(`/auth/login`).json({
      email: user.email,
      password: '102030',
      business_unit_id: unit.id,
    });

    const body = response.body();

    assert.equal(400, response.status());
    assert.equal(
      'E_EXPIRED_ADDITIONAL_TRIAL: Licença de teste adicional já expirou',
      body.message,
    );
  });

  test('should return 400 on expiried paid licence', async ({
    client,
    assert,
  }) => {
    const [user, unit] = await createUser({
      expiration: new Date('2022-06-01'),
      licenceType: LicenceType.PAY,
    });

    const response = await client.post(`/auth/login`).json({
      email: user.email,
      password: '102030',
      business_unit_id: unit.id,
    });

    const body = response.body();

    assert.equal(400, response.status());
    assert.equal('E_EXPIRED_LICENCE: Licença expirada', body.message);
  });
});
