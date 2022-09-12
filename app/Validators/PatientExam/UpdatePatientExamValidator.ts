import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdatePatientExamValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    realizedAt: schema.date.optional(),
    laboratory: schema.string(),
    report: schema.string(),
    examId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'exams', column: 'id' }),
    ]),
    patientId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    scheduleId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'schedules', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
