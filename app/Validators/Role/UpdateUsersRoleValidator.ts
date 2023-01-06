import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateUsersRoleValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    data: schema.array().members(
      schema.object().members({
        user_id: schema.string({}, [
          rules.uuid(),
          rules.exists({ table: 'users', column: 'id' }),
        ]),
        role_id: schema.number([
          rules.exists({ table: 'roles', column: 'id' }),
        ]),
        unit_id: schema.string({}, [
          rules.uuid(),
          rules.exists({ table: 'business_units', column: 'id' }),
        ]),
        active: schema.boolean(),
      }),
    ),
  });

  public messages: CustomMessages = {};
}
