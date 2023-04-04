import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CloseDailyCashierValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    userId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'users', column: 'id' }),
    ]),
    closingDate: schema.date(),
    cashierTotal: schema.number(),
    observations: schema.string.optional(),
  });

  public messages: CustomMessages = {};
}
