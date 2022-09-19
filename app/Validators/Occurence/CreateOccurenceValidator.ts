import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { OccurrenceType } from 'App/Models/Occurrence';

export default class CreateOccurenceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string(),
    type: schema.enum(Object.values(OccurrenceType)),
  });

  public messages: CustomMessages = {};
}
