import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateVariationOptionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    active: schema.boolean([]),
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
