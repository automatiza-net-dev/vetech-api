import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateTreatmentExecutionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    treatmentExecutionId: schema.number([
      rules.exists({ table: 'treatment_executions', column: 'id' }),
    ]),
    reasonId: schema.string([rules.exists({ table: 'reasons', column: 'id' })]),
    scheduleId: schema.string([
      rules.exists({ table: 'schedules', column: 'id' }),
    ]),

    observations: schema.string(),
  });

  public messages: CustomMessages = {};
}
