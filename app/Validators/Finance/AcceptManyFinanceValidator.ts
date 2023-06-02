import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class AcceptManyFinanceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    ids: schema
      .array()
      .members(
        schema.string({}, [
          rules.uuid(),
          rules.exists({ table: 'finances', column: 'id' }),
        ]),
      ),
  });

  public messages: CustomMessages = {};
}
