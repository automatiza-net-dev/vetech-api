import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class AddRolePermissionsValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    roleId: schema.number([rules.exists({ table: 'roles', column: 'id' })]),
    permissions: schema
      .array()
      .members(
        schema.number([rules.exists({ table: 'permissions', column: 'id' })]),
      ),
  });

  public messages: CustomMessages = {};
}
