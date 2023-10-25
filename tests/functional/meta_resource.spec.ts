import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import Meta from 'App/Models/Meta';
import { v4 } from 'uuid';
import { userBootstrap, generateJwtToken } from '../utils';

test.group('Meta resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group } = await userBootstrap();

    const meta = await Meta.create({
      economic_group_id: group.id,
      description: v4(),
      type: 'some type',
    });

    return { user, meta };
  };

  test('should get all metas', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client.get('/metas').bearerToken(token);

    assert.equal(200, result.status());
  });

  test('should create meta', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .post('/metas')
      .json({
        description: 'some description',
        type: 'some type',
      })
      .bearerToken(token);

    assert.equal(201, result.status());
  });

  test('should throw BadRequestException when creating duplicated meta', async ({
    assert,
    client,
  }) => {
    const { user, meta } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .post('/metas')
      .json({
        description: meta.description,
        type: 'some type',
      })
      .bearerToken(token);

    assert.equal(400, result.status());
  });

  test('should update meta', async ({ assert, client }) => {
    const { user, meta } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client
      .put(`/metas/${meta.id}`)
      .json({
        description: v4(),
        type: 'some type',
        active: true,
      })
      .bearerToken(token);

    assert.equal(204, result.status());
  });

  test('should throw BadRequestException when updated duplicated meta', async ({
    assert,
    client,
  }) => {
    const { user, meta } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const otherMeta = await Meta.create({
      economic_group_id: meta.economic_group_id,
      description: v4(),
      type: 'some type',
    });

    const result = await client
      .put(`/metas/${meta.id}`)
      .json({
        description: otherMeta.description,
        type: 'some type',
        active: true,
      })
      .bearerToken(token);

    assert.equal(400, result.status());
  });

  test('should delete meta', async ({ assert, client }) => {
    const { user, meta } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const result = await client.delete(`/metas/${meta.id}`).bearerToken(token);

    assert.equal(204, result.status());
  });
});
