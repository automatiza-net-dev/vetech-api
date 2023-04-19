import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class ManageRolePermissionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    data: schema.array().members(
      schema.object().members({
        role: schema.number([rules.exists({ table: 'roles', column: 'id' })]),
        permissions: schema.array().members(
          schema.object().members({
            id: schema.number([
              rules.exists({ table: 'permissions', column: 'id' }),
            ]),
            active: schema.boolean(),
          }),
        ),
      }),
    ),
  });

  public messages: CustomMessages = {};
}
