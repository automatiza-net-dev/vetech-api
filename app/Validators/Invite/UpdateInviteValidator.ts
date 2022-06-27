import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateInviteValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    business_unit_id: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'business_units',
        column: 'id',
      }),
    ]),
    role_id: schema.number([
      rules.exists({
        table: 'roles',
        column: 'id',
      }),
    ]),
    email: schema.string({}, [
      rules.email(),
      rules.unique({
        table: 'users',
        column: 'email',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
