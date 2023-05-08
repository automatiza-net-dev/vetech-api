import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class CheckDailyCashierValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    checkingDate: schema.date(),
    observations: schema.string(),
  });

  public messages: CustomMessages = {};
}
