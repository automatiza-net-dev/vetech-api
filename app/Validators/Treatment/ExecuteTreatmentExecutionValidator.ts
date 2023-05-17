import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class ExecuteTreatmentExecutionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    executionId: schema.number([
      rules.exists({ table: 'treatment_executions', column: 'id' }),
    ]),

    executionDate: schema.date(),
    observations: schema.string({ trim: true }),
  });

  public messages: CustomMessages = {};
}
