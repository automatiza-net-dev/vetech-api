import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateKitItemValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    kitId: schema.number([rules.exists({ table: 'kits', column: 'id' })]),
    productVariationId: schema.string({ trim: true }, [
      rules.exists({ table: 'product_variations', column: 'id' }),
    ]),
    quantity: schema.number(),
    discountPrice: schema.number(),
    discountPercentage: schema.number(),
  });

  public messages: CustomMessages = {};
}
