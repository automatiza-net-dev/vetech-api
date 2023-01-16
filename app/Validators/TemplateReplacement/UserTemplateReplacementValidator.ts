import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UserTemplateReplacementValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    base: schema.string(),
    user: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'users',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
