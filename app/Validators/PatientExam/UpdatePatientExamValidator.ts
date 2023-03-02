import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdatePatientExamValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    realizedAt: schema.date.optional(),
    laboratory: schema.string.optional(),
    report: schema.string(),
    patientId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    scheduleId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'schedules', column: 'id' }),
    ]),
    executionerId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'users', column: 'id' }),
    ]),
    executedAt: schema.date.optional({}),
    resultDate: schema.date.optional({}),
    releasedAt: schema.date.optional({}),
    status: schema.string.optional({}),
  });

  public messages: CustomMessages = {};
}
