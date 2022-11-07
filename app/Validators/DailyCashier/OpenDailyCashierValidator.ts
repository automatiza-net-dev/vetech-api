import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class OpenDailyCashierValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    dailyMovementId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'daily_movements', column: 'id' }),
    ]),
    userId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'users', column: 'id' }),
    ]),
    openingDate: schema.date(),
    initialBalance: schema.number(),
  });

  public messages: CustomMessages = {};
}
