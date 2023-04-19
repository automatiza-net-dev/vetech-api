import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdatePermissionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    control: schema.string({}, []),
    screenId: schema.number([rules.exists({ table: 'screens', column: 'id' })]),
  });

  public messages: CustomMessages = {};
}
