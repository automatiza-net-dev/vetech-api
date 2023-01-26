import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { AccountPlanType } from 'App/Models/AccountPlan';

export default class UpdateAccountPlanValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    code: schema.string(),
    description: schema.string(),
    type: schema.enum(Object.values(AccountPlanType)),
    accountPlanGroupId: schema.number([
      rules.exists({
        table: 'account_plan_groups',
        column: 'id',
      }),
    ]),
    parentId: schema.string.optional([
      rules.exists({
        table: 'account_plans',
        column: 'id',
      }),
    ]),
    active: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
