import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import TaxationGroup from 'App/Models/TaxationGroup';
import TaxationGroupRule, {
  CompanyType,
  MovementCategory,
  MovementType,
} from 'App/Models/TaxationGroupRule';
import TaxOperation from 'App/Models/TaxOperation';
import { v4 } from 'uuid';

import { generateJwtToken, userBootstrap } from '../utils';

test.group('Taxation group rule resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group } = await userBootstrap();

    const taxation = await TaxationGroup.create({
      name: 'any name',
      economic_group_id: group.id,
    });

    const operation = await TaxOperation.create({
      code: 'any code',
      description: 'any description',
      movementType: MovementType.E,
      movementCategory: MovementCategory.DE,
      generatesFinancial: true,
      accountingResult: true,
    });

    const rule = await TaxationGroupRule.create({
      companyType: CompanyType.N,
      movementType: MovementType.S,
      movementCategory: MovementCategory.DE,
      fromUf: 'PB',
      toUf: 'PB',
      icmsCst: '00',
      icmsPerc: 10,
      icmsPercRedAliquota: 10,
      icmsPercRedBaseCalculo: 10,
      ivaIcmsSt: 10,
      fcpPerc: 10,
      taxBenefitCode: '10',
      ipiCst: '00',
      ipiPerc: 10,
      pisCst: '01',
      pisPerc: 10,
      cofinsCst: '01',
      cofinsPerc: 10,
      tax_operation_id: operation.id,
      taxation_group_id: taxation.id,
    });

    return { user, taxation, operation, rule };
  };

  test('should list taxation group rules', async ({ assert, client }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get('/taxation-group-rules')
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should be able to create a new rule', async ({ assert, client }) => {
    const { user, taxation, operation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .post('/taxation-group-rules')
      .json({
        companyType: CompanyType.N,
        movementType: MovementType.S,
        movementCategory: MovementCategory.DE,
        fromUf: 'PB',
        toUf: 'PB',
        icmsCst: '00',
        icmsPerc: 10,
        icmsPercRedAliquota: 10,
        icmsPercRedBaseCalculo: 10,
        ivaIcmsSt: 10,
        fcpPerc: 10,
        taxBenefitCode: '10',
        ipiCst: '00',
        ipiPerc: 10,
        pisCst: '01',
        pisPerc: 10,
        cofinsCst: '01',
        cofinsPerc: 10,
        taxOperationId: operation.id,
        taxationGroupId: taxation.id,
      })
      .bearerToken(token);

    response.assertStatus(201);
  });

  test('should throw NotFoundException if no rule is found', async ({
    assert,
    client,
  }) => {
    const { user } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/taxation-group-rules/${v4()}`)
      .bearerToken(token);

    assert.equal(404, response.status());
  });

  test('should be able to show a rule', async ({ assert, client }) => {
    const { user, rule } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .get(`/taxation-group-rules/${rule.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should be able to update a rule', async ({ assert, client }) => {
    const { user, rule, taxation, operation } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .put(`/taxation-group-rules/${rule.id}`)
      .json({
        companyType: CompanyType.N,
        movementType: MovementType.S,
        movementCategory: MovementCategory.DE,
        fromUf: 'PB',
        toUf: 'PB',
        icmsCst: '00',
        icmsPerc: 10,
        icmsPercRedAliquota: 10,
        icmsPercRedBaseCalculo: 10,
        ivaIcmsSt: 10,
        fcpPerc: 10,
        taxBenefitCode: '10',
        ipiCst: '00',
        ipiPerc: 10,
        pisCst: '01',
        pisPerc: 10,
        cofinsCst: '01',
        cofinsPerc: 10,
        active: true,
        taxOperationId: operation.id,
        taxationGroupId: taxation.id,
      })
      .bearerToken(token);

    assert.equal(200, response.status());
  });

  test('should delete a rule', async ({ assert, client }) => {
    const { user, rule } = await createData();
    const token = await generateJwtToken(client, {
      email: user.email,
      password: '102030',
    });

    const response = await client
      .delete(`/taxation-group-rules/${rule.id}`)
      .bearerToken(token);

    assert.equal(200, response.status());
  });
});
