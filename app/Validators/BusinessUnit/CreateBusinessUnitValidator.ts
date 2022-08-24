import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator';

export default class CreateBusinessUnitValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    economic_group_id: schema.string({}, [
      rules.exists({
        column: 'id',
        table: 'economic_groups',
      }),
    ]),
    document: schema.string({}),
    email: schema.string({}, [rules.email()]),
    phone: schema.string.optional({}, [rules.maxLength(14)]),
    identification: schema.string.optional({}, [rules.maxLength(80)]),
    fantasyName: schema.string.optional({}, [rules.maxLength(80)]),
    companyName: schema.string.optional({}, [rules.maxLength(80)]),
    postalCode: schema.string.optional({}),
    address: schema.string.optional({}),
    number: schema.string.optional({}),
    complement: schema.string.optional({}),
    district: schema.string.optional({}),
    city: schema.string.optional({}),
    state: schema.string.optional({}),
    active: schema.boolean.optional([]),
  });

  public messages: CustomMessages = {};
}
