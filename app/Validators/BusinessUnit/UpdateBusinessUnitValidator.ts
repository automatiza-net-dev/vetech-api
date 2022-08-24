import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateBusinessUnitValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    phone: schema.string.optional({}, [rules.maxLength(14)]),
    identification: schema.string.optional({}, [rules.maxLength(80)]),
    fantasyName: schema.string.optional({}, [rules.maxLength(80)]),
    companyName: schema.string.optional({}, [rules.maxLength(80)]),
    email: schema.string.optional({}, [rules.email()]),
    document: schema.string.optional({}),
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
