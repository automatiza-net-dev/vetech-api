import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreatePatientExamAttachmentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    patientId: schema.string({}, [
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    realizedAt: schema.date(),
    attachments: schema.array().members(schema.file()),
  });

  public messages: CustomMessages = {};
}
