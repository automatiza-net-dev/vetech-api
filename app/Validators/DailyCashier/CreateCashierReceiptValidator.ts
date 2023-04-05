import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateCashierReceiptValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    entryDate: schema.date(),
    description: schema.string(),
    value: schema.number(),
  });

  public messages: CustomMessages = {};
}
