import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { CheckingAccountType } from 'App/Models/CheckingAccount';

export default class UpdateCheckingAccountValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string(),
    bankCode: schema.string(),
    bankName: schema.string(),
    agency: schema.string(),
    agencyPhone: schema.string(),
    managerName: schema.string(),
    managerPhone: schema.string(),
    managerEmail: schema.string(),
    limit: schema.number(),
    type: schema.enum(Object.values(CheckingAccountType)),
    active: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
