import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class ForgotPasswordValidator {
  constructor(protected ctx: HttpContextContract) {}
  public schema = schema.create({
    email: schema.string({}, [
      rules.email(),
      rules.exists({ table: 'users', column: 'email' }),
    ]),
    systemName: schema.string({}, [
      rules.exists({ table: 'systems', column: 'name' }),
    ]),
  });
  public messages: CustomMessages = {};
}
