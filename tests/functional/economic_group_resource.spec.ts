import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import EconomicGroup from 'App/Models/EconomicGroup';
import User from 'App/Models/User';

import { userBootstrap } from '../utils';

test.group('Economic group resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createEconomicGroup = async (): Promise<[EconomicGroup, User]> => {
    const { user, group } = await userBootstrap();
    return [group, user];
  };

  test('should return a list of all economic groups', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/economic-groups');

    const economicGroups = response.body();

    assert.isArray(economicGroups);
  });

  test('should return a list of all economic group users', async ({
    client,
    assert,
  }) => {
    const [group, user] = await createEconomicGroup();
    const response = await client.get(`/economic-groups/${group.id}/users`);

    const users = response.body();

    assert.isArray(users);
    assert.equal(user.id, users[0].id);
  });

  test('should return a list of user economic groups"', async ({
    client,
    assert,
  }) => {
    const [group, user] = await createEconomicGroup();
    const response = await client.get(`/economic-groups/user`).loginAs(user);

    const groups = response.body();

    assert.isArray(groups);
    assert.equal(group.id, groups[0].id);
  });

  test('update economic group', async ({ client, assert }) => {
    const [group] = await createEconomicGroup();
    const response = await client.put(`/economic-groups/${group.id}`).json({
      fantasyName: 'new fantasy name',
      companyName: 'new company name',
      document: '1234',
      responsibleEmail: 'responsible123@mail.com',
      responsiblePhone: '123123',
    });

    const updatedGroup = response.body();

    assert.equal(group.id, updatedGroup.id);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    assert.notEqual(group.fantasy_name, updatedGroup.fantasy_name);
  });
});
