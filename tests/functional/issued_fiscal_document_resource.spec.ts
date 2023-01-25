import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Issued fiscal document resource', group => {
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

  test('should search issued fiscal document', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/fiscal-documents/issued-documents`)
      .bearerToken(token);

    assert.isArray(response.body());
    assert.equal(200, response.status());
  });
});
