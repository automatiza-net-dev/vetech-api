import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import EconomicGroup from 'App/Models/EconomicGroup';
import Specie from 'App/Models/Specie';
import User from 'App/Models/User';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Specie resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<[User, EconomicGroup, Specie]> => {
    const { user, group } = await userBootstrap();

    const specie = await group.related('species').create({
      id: v4(),
      description: 'some specie',
      code: v4(),
    });

    return [user, group, specie];
  };

  test('should create specie', async ({ assert, client }) => {
    const [user] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/species')
      .json({
        description: 'some specie',
        code: v4(),
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(201, response.status());
    assert.equal('some specie', body.description);
  });

  test('should return all species from group', async ({ assert, client }) => {
    const [user, _, specie1] = await createData();
    const [__, ___, specie2] = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/species').bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.isTrue(Boolean(body.find(b => b.id === specie1.id)));
    assert.isFalse(Boolean(body.find(b => b.id === specie2.id)));
  });

  test('should throw NotFoundException if no specie is found', async ({
    assert,
    client,
  }) => {
    const [user] = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/species/${v4()}`).bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Espécie não foi encontrada', body.message);
  });

  test('should return species', async ({ assert, client }) => {
    const [user, _, species] = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/species/${species.id}`)
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(species.id, body.id);
  });

  test('should update a  specie', async ({ assert, client }) => {
    const [user, _, species] = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/species/${species.id}`)
      .json({
        description: 'updated specie',
        code: v4(),
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(species.id, body.id);
    assert.notEqual(species.description, body.description);
  });

  test('should soft delete a  specie', async ({ assert, client }) => {
    const [user, _, species] = await createData();

    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/species/${species.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
