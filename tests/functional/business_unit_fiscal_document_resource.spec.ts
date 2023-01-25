import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import {
  FiscalDocumentMovementType,
  FiscalDocumentType,
} from 'App/Models/FiscalDocument';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Business unit fiscal document resource', group => {
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

  test('should create business unit fiscal document', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post(`/fiscal-documents/business-unit/store`)
      .json({
        type: FiscalDocumentType.P,
        movement: FiscalDocumentMovementType.A,
        description: 'some description',
        model: 'some model',
        series: 'some series',
        sequence: 1,
      })
      .bearerToken(token);

    assert.equal(201, response.status());
  });
});
