import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { schema, CustomMessages } from '@ioc:Adonis/Core/Validator';

export default class CreateReasonValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    reason: schema.string(),
    type: schema.string(),
    requiresObservation: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
