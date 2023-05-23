import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateTreatmentItemValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    treatmentId: schema.number([
      rules.exists({ table: 'treatments', column: 'id' }),
    ]),
    kitId: schema.number.optional([
      rules.exists({ table: 'kits', column: 'id' }),
    ]),
    productVariationId: schema.string([
      rules.exists({ table: 'product_variations', column: 'id' }),
    ]),

    quantity: schema.number(),
  });

  public messages: CustomMessages = {};
}
