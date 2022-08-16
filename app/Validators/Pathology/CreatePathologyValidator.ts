import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreatePathologyValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    definition: schema.string({}, []),
    templateId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'document_templates',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
