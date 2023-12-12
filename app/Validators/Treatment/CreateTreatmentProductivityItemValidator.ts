import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateTreatmentProductivityItemValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    treatmentId: schema.number([
      rules.exists({ table: 'treatments', column: 'id' }),
    ]),
    treatmentItemId: schema.number([
      rules.exists({ table: 'treatment_items', column: 'id' }),
    ]),
    productivityItemId: schema.number([
      rules.exists({ table: 'productivity_items', column: 'id' }),
    ]),

    quantity: schema.number(),
  });

  public messages: CustomMessages = {};
}
