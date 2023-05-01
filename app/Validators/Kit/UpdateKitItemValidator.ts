import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateKitItemValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    productVariationId: schema.string({ trim: true }, [
      rules.exists({ table: 'product_variations', column: 'id' }),
    ]),
    quantity: schema.number(),
    discountPrice: schema.number(),
    discountPercentage: schema.number(),
  });

  public messages: CustomMessages = {};
}
