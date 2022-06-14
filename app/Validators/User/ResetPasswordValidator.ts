import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class ResetPasswordValidator {
  constructor(protected ctx: HttpContextContract) {}
  public schema = schema.create({
    hash: schema.string({}),
    email: schema.string({}, [
      rules.email(),
      rules.exists({ table: 'users', column: 'email' }),
    ]),
    password: schema.string({}, [rules.confirmed()]),
  });
  public messages: CustomMessages = {};
}
