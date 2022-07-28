import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateDocumentTemplateValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    title: schema.string({}, []),
    description: schema.string({}, []),
    header: schema.string({}, []),
    template: schema.string({}, []),
  });

  public messages: CustomMessages = {};
}
