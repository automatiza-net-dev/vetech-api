import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { CheckingAccountOperation } from 'App/Models/CheckingAccount';

export default class UpdateCheckingAccountBalanceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    amount: schema.number(),
    operation: schema.enum(Object.values(CheckingAccountOperation)),
  });

  public messages: CustomMessages = {};
}
