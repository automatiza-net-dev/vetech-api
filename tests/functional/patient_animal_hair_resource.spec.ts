import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Patient animal hair resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user } = await userBootstrap();

    return {
      user,
    };
  };

  test('should search for patient animal hairs', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/patient-animal-hairs`)
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  });
});
