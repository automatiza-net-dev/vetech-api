import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CancelTreatmentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    treatmentId: schema.number([
      rules.exists({ table: 'treatments', column: 'id' }),
    ]),
    reasonId: schema.string([rules.exists({ table: 'reasons', column: 'id' })]),

    cancellationDate: schema.date(),
    cancellationObservations: schema.string(),
  });

  public messages: CustomMessages = {};
}
