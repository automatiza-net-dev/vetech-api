import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateKitValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string(),
    fromExpiration: schema.date(),
    toExpiration: schema.date(),
    active: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
