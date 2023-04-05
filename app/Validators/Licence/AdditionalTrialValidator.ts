import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class AdditionalTrialValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    unit: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'business_units',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
