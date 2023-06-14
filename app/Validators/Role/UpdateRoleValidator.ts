import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { RoleType } from 'App/Models/Role';

export default class UpdateRoleValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}, []),
    type: schema.enum(Object.values(RoleType)),
    active: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
