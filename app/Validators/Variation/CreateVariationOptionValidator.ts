import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';

export default class CreateVariationOptionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    variationId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'variations',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
