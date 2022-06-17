import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateRoleValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}, [rules.unique({ table: 'roles', column: 'name' })]),
  });

  public messages: CustomMessages = {};
}
