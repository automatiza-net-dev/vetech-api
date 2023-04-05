import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner'
import { userBootstrap, generateJwtToken } from '../utils';

test.group('Fiscal document resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });


  const createData = async () => {
    const { user } = await userBootstrap();

    return { user }
  }

  test('should return all fiscal documents', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client.get(`/fiscal-documents`).bearerToken(token);

    assert.equal(200, response.status());
    assert.isArray(response.body());
  })
})
