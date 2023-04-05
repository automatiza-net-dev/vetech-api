import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { TemplateReplacementOrigin } from 'App/Models/TemplateReplacement';

export default class UpdateTemplateReplacementValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    origin: schema.enum(Object.values(TemplateReplacementOrigin), []),
    attribute: schema.string(),
    replacer: schema.string(),
  });

  public messages: CustomMessages = {};
}
