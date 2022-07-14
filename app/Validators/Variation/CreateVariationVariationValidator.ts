import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateVariationVariationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    group_variation_id: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'variation_groups',
        column: 'id',
      }),
    ]),
    variation_id: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'variations',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
