import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateUserValidator {
  constructor(protected ctx: HttpContextContract) {}
  public schema = schema.create({
    name: schema.string.optional({}),
    email: schema.string.optional({}, [rules.email()]),
    password: schema.string.optional({}, [rules.confirmed()]),
    document: schema.string.optional({}, []),
    phone: schema.string.optional({}),
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
