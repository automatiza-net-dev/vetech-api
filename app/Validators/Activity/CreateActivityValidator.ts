import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator';

export default class CreateActivityValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({ trim: true }),
    duration: schema.number(),
    type: schema.string({ trim: true }),
  });

  public messages: CustomMessages = {};
}
