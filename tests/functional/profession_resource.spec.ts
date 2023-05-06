import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Profession from 'App/Models/Profession';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Profession resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user } = await userBootstrap();

    const profession = await Profession.create({
      description: 'some description',
    });

    return { user, profession };
  };

  test('should return a list of professions', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get('/professions').bearerToken(token);

    assert.isArray(response.body());
    assert.equal(200, response.status());
  });

  test('should throw BadRequestException if no profession was found', async ({
    client,
    assert,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/professions/${-1}`).bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should return profession', async ({ client, assert }) => {
    const { user, profession } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/professions/${profession.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });
});
