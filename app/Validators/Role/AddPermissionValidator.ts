import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class AddPermissionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    role_id: schema.number([rules.exists({ table: 'roles', column: 'id' })]),
    permission_id: schema.number([
      rules.exists({ table: 'permissions', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
