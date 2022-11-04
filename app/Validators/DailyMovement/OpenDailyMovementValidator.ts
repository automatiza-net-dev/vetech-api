import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class OpenDailyMovementValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    userId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'users', column: 'id' }),
    ]),
    openingDate: schema.date(),
  });

  public messages: CustomMessages = {};
}
