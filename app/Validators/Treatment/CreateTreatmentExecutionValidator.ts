import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateTreatmentExecutionValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    treatmentId: schema.number([
      rules.exists({ table: 'treatments', column: 'id' }),
    ]),
    treatmentItemId: schema.number([
      rules.exists({ table: 'treatment_items', column: 'id' }),
    ]),
    scheduleId: schema.string({ trim: true }, [
      rules.exists({ table: 'schedules', column: 'id' }),
    ]),

    scheduledQuantity: schema.number(),
    scheduleDate: schema.date(),
  });

  public messages: CustomMessages = {};
}
