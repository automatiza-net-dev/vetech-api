import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { RoleType } from 'App/Models/Role';

export default class CreateRoleValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}, [rules.unique({ table: 'roles', column: 'name' })]),
    type: schema.enum(Object.values(RoleType)),
  });

  public messages: CustomMessages = {};
}
