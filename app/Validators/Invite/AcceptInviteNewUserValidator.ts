import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class AcceptInviteNewUserValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    id: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'invites',
        column: 'id',
      }),
    ]),
    name: schema.string({}),
    password: schema.string({}, [rules.confirmed()]),
  });

  public messages: CustomMessages = {};
}
