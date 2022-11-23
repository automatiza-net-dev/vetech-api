import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class ConfirmBudgetValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    finishedAt: schema.date(),
  });

  public messages: CustomMessages = {};
}
