import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class ConfirmConfirmationTokenValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    code: schema.string([
      rules.exists({
        table: 'confirmation_tokens',
        column: 'code',
      }),
    ]),
    email: schema.string([
      rules.exists({
        table: 'confirmation_tokens',
        column: 'email',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
