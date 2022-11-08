import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { AccountPlanType } from 'App/Models/AccountPlan';

export default class CreateAccountPlanValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    code: schema.string(),
    description: schema.string(),
    type: schema.enum(Object.values(AccountPlanType)),
  });

  public messages: CustomMessages = {};
}
