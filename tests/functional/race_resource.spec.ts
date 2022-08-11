import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Race from 'App/Models/Race';
import Specie from 'App/Models/Specie';
import User from 'App/Models/User';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Race resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<[User, Specie, Race]> => {
    const { user, group } = await userBootstrap();

    const specie = await group.related('species').create({
      id: v4(),
      description: 'some specie',
    });

    const race = await specie.related('races').create({
      id: v4(),
      description: 'some race',
      economic_group_id: group.id,
    });

    return [user, specie, race];
  };

  test('should create a new race', async ({ assert, client }) => {
    const [user, specie] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/races')
      .json({
        description: 'some race',
        specie_id: specie.id,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(201, response.status());
    assert.equal('some race', body.description);
  });

  test('should return group races', async ({ assert, client }) => {
    const [user, _, race] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/races`).bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.isArray(body);
    assert.isTrue(Boolean(body.find(b => b.id === race.id)));
  });

  test('should throw ResourceNotFoundException if no race matches', async ({
    assert,
    client,
  }) => {
    const [user] = await createData();
    const [__, ___, race2] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/races/${race2.id}`).bearerToken(token);

    const body = response.body();

    assert.equal(404, response.status());
    assert.equal('E_NOT_FOUND: Raça não foi encontrada', body.message);
  });

  test('should return the race', async ({ assert, client }) => {
    const [user, _, race] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/races/${race.id}`).bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(race.id, body.id);
  });

  test('should update a race', async ({ assert, client }) => {
    const [user, specie, race] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/races/${race.id}`)
      .json({
        description: 'updated race',
        specie_id: specie.id,
      })
      .bearerToken(token);

    const body = response.body();

    assert.equal(200, response.status());
    assert.equal(race.id, body.id);
    assert.equal('updated race', body.description);
  });

  test('should soft delete a race', async ({ assert, client }) => {
    const [user, _, race] = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/races/${race.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
