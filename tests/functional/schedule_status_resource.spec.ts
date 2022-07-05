import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import BusinessUnit from 'App/Models/BusinessUnit';
import { LicenceType } from 'App/Models/Licence';
import User from 'App/Models/User';
import UserFactory from 'Database/factories/UserFactory';
import { addDays } from 'date-fns';
import { v4 } from 'uuid';

import { createSudo, generateJwtToken } from '../utils';

test.group('Schedule status resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
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

    await newBusinessUnit.related('licences').create({
      id: v4(),
      active: true,
      expirationDate: addDays(new Date(), 1),
      type: LicenceType.TRIAL,
    });

    return { user, newBusinessUnit };
  };

  const assignSuperAdmin = async (user: User, businessUnit: BusinessUnit) => {
    const [sudoRole] = await createSudo();
    await user.related('roles').create({
      role_id: sudoRole.id,
      unit_id: businessUnit.id,
    });
  };

  test('should create new schedule status for super admin', async ({
    assert,
    client,
  }) => {
    const { user, newBusinessUnit } = await createData();
    await assignSuperAdmin(user, newBusinessUnit);

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/schedule-statuses')
      .json({
        description: 'some status',
        color: '#000',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
    assert.isUndefined(response.body().economic_group_id);
  });

  test('should create new schedule status for normal user', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/schedule-statuses')
      .json({
        description: 'some status',
        color: '#000',
      })
      .bearerToken(token);

    assert.equal(201, response.status());
    assert.isDefined(response.body().economic_group_id);
  });
});
