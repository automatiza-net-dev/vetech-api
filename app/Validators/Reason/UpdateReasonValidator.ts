import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { REASON_TYPES } from 'App/Models/Reason';

export default class UpdateReasonValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    reason: schema.string(),
    type: schema.enum(Object.values(REASON_TYPES)),
    requiresObservation: schema.boolean(),
    active: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
