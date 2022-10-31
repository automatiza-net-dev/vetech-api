import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateReasonValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    reason: schema.string(),
    type: schema.string(),
    requiresObservation: schema.boolean(),
    active: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
