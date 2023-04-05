import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { TemplateReplacementOrigin } from 'App/Models/TemplateReplacement';

export default class CreateTemplateReplacementValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    origin: schema.enum(Object.values(TemplateReplacementOrigin)),
    attribute: schema.string(),
    replacer: schema.string([
      rules.unique({
        table: 'template_replacements',
        column: 'replacer',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
