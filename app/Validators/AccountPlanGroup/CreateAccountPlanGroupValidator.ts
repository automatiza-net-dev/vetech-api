import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { AccountPlanGroupType } from 'App/Models/AccountPlanGroup';

export default class CreateAccountPlanGroupValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string(),
    type: schema.enum(Object.values(AccountPlanGroupType)),
  });

  public messages: CustomMessages = {};
}
