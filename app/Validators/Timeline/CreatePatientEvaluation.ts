import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreatePatientEvaluationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tag: schema.string({}, [rules.uuid()]),
    resume: schema.string(),
    protocol: schema.string(),
    realizedAt: schema.date(),
    observation: schema.string.optional(),
    technicianId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'users',
        column: 'id',
      }),
    ]),
    photos: schema.array.optional().members(
      schema.file({
        extnames: ['jpg', 'gif', 'png', 'jpeg'],
      }),
    ),
  });

  public messages: CustomMessages = {};
}
