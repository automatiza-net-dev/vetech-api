import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator';

export default class UpdateContactTypeValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({ trim: true }),
    type: schema.string({ trim: true }),
    observation: schema.string({ trim: true }),
    active: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
