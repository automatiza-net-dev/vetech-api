import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import EconomicGroup from 'App/Models/EconomicGroup';
import Licence, { LicenceType } from 'App/Models/Licence';
import Plan from 'App/Models/Plan';
import User from 'App/Models/User';
import LicenceService from 'App/Services/LicenceService';
import UserFactory from 'Database/factories/UserFactory';
import { addDays } from 'date-fns';
import { v4 } from 'uuid';

type CreateLicence = {
  type: LicenceType;
  expiration: Date;
  active: boolean;
};

test.group('Licence resource', group => {
  let service: LicenceService;

  group.setup(async () => {
    service = new LicenceService();
  });

  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createBusinessUnit = async (
    data: CreateLicence,
  ): Promise<[BusinessUnit, EconomicGroup, User, Licence]> => {
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

    const licence = await newBusinessUnit.related('licences').create({
      id: v4(),
      type: data.type,
      active: data.active,
      expirationDate: data.expiration,
    });

    await Plan.create({
      id: v4(),
      default: true,
      description: '',
      trialDays: 10,
      trialAdditional: 10,
    });

    return [newBusinessUnit, newGroup, user, licence];
  };

  test('should throw error if no active licence', async ({ assert }) => {
    const [unit] = await createBusinessUnit({
      expiration: new Date(),
      type: LicenceType.ADDITIONAL_TRIAL,
      active: false,
    });

    try {
      await service.addAdditionalTrial(unit);
    } catch (err) {
      assert.equal('E_NO_LICENCE: Não existe licença ativa', err.message);
    }
  });

  test('should throw error if licence is not trial', async ({ assert }) => {
    const [unit] = await createBusinessUnit({
      expiration: new Date(),
      type: LicenceType.PAY,
      active: true,
    });

    try {
      await service.addAdditionalTrial(unit);
    } catch (err) {
      assert.equal(
        'E_BAD_LICENCE: Apenas licença em teste podem ser extendidas',
        err.message,
      );
    }
  });

  test('should throw error if licence has invalid expiration date', async ({
    assert,
  }) => {
    const [unit] = await createBusinessUnit({
      expiration: new Date('2025-01-01'),
      type: LicenceType.TRIAL,
      active: true,
    });

    try {
      await service.addAdditionalTrial(unit);
    } catch (err) {
      assert.equal('E_BAD_LICENCE: Licença ainda não expirou', err.message);
    }
  });

  test('should create ustom licence', async ({ client, assert }) => {
    const [unit] = await createBusinessUnit({
      expiration: new Date('2025-01-01'),
      type: LicenceType.TRIAL,
      active: true,
    });

    const response = await client.post('/licences/custom').json({
      business_unit_id: unit.id,
      expiration_date: addDays(new Date(), 10),
    });

    const unitLicences = await unit.related('licences').query();

    assert.equal(201, response.status());
    assert.equal(2, unitLicences.length);
  });
});
