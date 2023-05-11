import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateAttendanceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    resume: schema.string(),
    protocol: schema.string(),
    internalObservation: schema.string.optional(),
  });

  public messages: CustomMessages = {};
}
