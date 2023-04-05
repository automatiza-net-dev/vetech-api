import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateConfirmationTokenValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string(),
    phone: schema.string(),
    email: schema.string([
      rules.unique({
        table: 'users',
        column: 'email',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
