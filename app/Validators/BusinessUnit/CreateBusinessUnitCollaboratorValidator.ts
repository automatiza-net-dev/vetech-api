import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateBusinessUnitCollaboratorValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    userId: schema.string({}, [
      rules.exists({
        column: 'id',
        table: 'users',
      }),
    ]),
    roleId: schema.number([
      rules.exists({
        column: 'id',
        table: 'roles',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
