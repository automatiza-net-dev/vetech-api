import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateHospitalizationOccurrenceAttachmentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    occurrenceId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'hospitalization_occurrences', column: 'id' }),
    ]),
    attachments: schema.array().members(schema.file()),
  });

  public messages: CustomMessages = {};
}
