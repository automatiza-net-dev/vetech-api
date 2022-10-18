import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import TaxOperation from 'App/Models/TaxOperation';

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
      movementType: 'any movement type',
      movementCategory: 'any movement category',
      generatesFinancial: true,
      accountingResult: true,
    });

    return { user, operation };
  };

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
        movementType: 'any movement type',
        movementCategory: 'any movement category',
        generatesFinancial: true,
        accountingResult: true,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });
});
