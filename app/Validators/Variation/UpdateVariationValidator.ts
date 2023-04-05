import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator';

export default class UpdateVariationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    active: schema.boolean([]),
  });

  public messages: CustomMessages = {};
}
