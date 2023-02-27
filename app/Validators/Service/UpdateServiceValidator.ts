import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateServiceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    referenceCode: schema.string.optional({}, []),
    subgroupId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'subgroups',
        column: 'id',
      }),
    ]),
    features: schema.string.optional({}, []),
    taxationGroupId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'taxation_groups',
        column: 'id',
      }),
    ]),
    unitId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'units',
        column: 'id',
      }),
    ]),
    active: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
