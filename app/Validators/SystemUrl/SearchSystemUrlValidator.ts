import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class SearchSystemUrlValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    url: schema.string([rules.exists({ table: 'system_urls', column: 'url' })]),
  });

  public messages: CustomMessages = {};
}
