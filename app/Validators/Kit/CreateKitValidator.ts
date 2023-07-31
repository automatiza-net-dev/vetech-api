import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateKitValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string(),
    fromExpiration: schema.date.optional(),
    toExpiration: schema.date.optional(),
  });

  public messages: CustomMessages = {};
}
