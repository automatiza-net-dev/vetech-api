import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { CheckingAccountType } from 'App/Models/CheckingAccount';

export default class OpenCheckingAccountValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string(),
    accountNumber: schema.string(),
    bankCode: schema.string(),
    bankName: schema.string(),
    agency: schema.string(),
    type: schema.enum(Object.values(CheckingAccountType)),
  });

  public messages: CustomMessages = {};
}
