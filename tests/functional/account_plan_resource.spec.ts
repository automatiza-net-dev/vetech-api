import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import AccountPlan, { AccountPlanType } from 'App/Models/AccountPlan';
import AccountPlanGroup, {
  AccountPlanGroupType,
} from 'App/Models/AccountPlanGroup';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Account plan resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, business, group } = await userBootstrap();

    const apg = await AccountPlanGroup.create({
      economic_group_id: group.id,
      description: 'some description',
      type: AccountPlanGroupType.A,
    });

    const ap_parent = await AccountPlan.create({
      business_unit_id: business.id,
      description: 'some description',
      code: 'some code',
      account_plan_group_id: apg.id,
    });

    const ap = await AccountPlan.create({
      business_unit_id: business.id,
      description: 'some description',
      code: 'some code',
      account_plan_group_id: apg.id,
      parent_id: ap_parent.id,
    });

    return { user, ap, apg };
  };

  test('should get all account plans', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client.get('/account-plans').bearerToken(token);

    assert.equal(200, result.status());
    assert.isArray(result.body());
  });

  test('should create account plan', async ({ assert, client }) => {
    const { user, apg } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .post('/account-plans')
      .json({
        description: 'some description',
        code: 'any code',
        type: AccountPlanType.C,
        accountPlanGroupId: apg.id,
      })
      .bearerToken(token);

    assert.equal(201, result.status());
  });

  test('should create account plan with parent', async ({ assert, client }) => {
    const { user, apg, ap } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .post('/account-plans')
      .json({
        description: 'some description',
        code: 'any code',
        type: AccountPlanType.C,
        accountPlanGroupId: apg.id,
        parentId: ap.id,
      })
      .bearerToken(token);

    assert.equal(201, result.status());
  });

  test('should return account plans', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client.get('/account-plans').bearerToken(token);

    assert.equal(200, result.status());
  });

  test('should return single account plans', async ({ assert, client }) => {
    const { user, ap } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .get(`/account-plans/${ap.id}`)
      .bearerToken(token);

    assert.equal(200, result.status());
  });
});
