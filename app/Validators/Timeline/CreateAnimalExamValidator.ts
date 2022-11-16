import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateAnimalExamValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tag: schema.string({}, [rules.uuid()]),
    name: schema.string({}, []),
    realizedAt: schema.date({}),
    requesterId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'users',
        column: 'id',
      }),
    ]),
    technicianId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'users',
        column: 'id',
      }),
    ]),
    description: schema.string({}, []),
    attachments: schema.array.optional().members(schema.file({}, [])),
    examId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'patient_exams',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
