import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import { MovementCategory, MovementType } from 'App/Models/TaxationGroupRule';
import TaxOperation from 'App/Models/TaxOperation';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Tax operation resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group } = await userBootstrap();

    const operation = await TaxOperation.create({
      code: 'any code',
      description: 'any description',
      movementType: MovementType.E,
      movementCategory: MovementCategory.DE,
      generatesFinancial: true,
      accountingResult: true,
      economic_group_id: group.id,
    });

    return { user, operation };
  };

  test('should list tax operations', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get('/tax-operations')

      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should throw NotFoundException if no operation is found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/tax-operations/${v4()}`)
      .bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should get tax operation', async ({ assert, client }) => {
    const { user, operation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/tax-operations/${operation.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should create new tax operation', async ({ client, assert }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/tax-operations')
      .json({
        code: 'any code',
        description: 'any description',
        movementType: MovementType.E,
        movementCategory: MovementCategory.DE,
        generatesFinancial: true,
        accountingResult: true,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });

  test('should update tax operation', async ({ client, assert }) => {
    const { user, operation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/tax-operations/${operation.id}`)
      .json({
        code: 'new code',
        description: 'any description',
        movementType: MovementType.E,
        movementCategory: MovementCategory.DE,
        generatesFinancial: true,
        accountingResult: true,
        active: true,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
    assert.notEqual(operation.code, response.body().code);
  });

  test('should delete tax operation', async ({ client, assert }) => {
    const { user, operation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/tax-operations/${operation.id}`)
      .bearerToken(token);

    assert.equal(204, response.status());
  });
});
