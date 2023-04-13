import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreatePatientExamValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    realizedAt: schema.date.optional(),
    laboratory: schema.string.optional(),
    report: schema.string(),
    examId: schema.string({}, [rules.exists({ table: 'exams', column: 'id' })]),
    patientId: schema.string({}, [
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    scheduleId: schema.string.optional({}, [
      rules.exists({ table: 'schedules', column: 'id' }),
    ]),
    solicitorId: schema.string({}, [
      rules.exists({ table: 'users', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
