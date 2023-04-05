import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateSubgroupValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    parent: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'subgroups',
        column: 'id',
      }),
    ]),
    variationGroup: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'variation_groups',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
