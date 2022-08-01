import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateBusinessUnitProductValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    productVariationId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'product_variations',
        column: 'id',
      }),
    ]),
    stock: schema.number([rules.unsigned()]),
    maximumStock: schema.number([rules.unsigned()]),
    minimumStock: schema.number([rules.unsigned()]),
    maximumDiscountPercentage: schema.number([rules.unsigned()]),
    maximumDiscountValue: schema.number([rules.unsigned()]),
    price: schema.number([rules.unsigned()]),
    costPrice: schema.number([rules.unsigned()]),
    profitMargin: schema.number([rules.unsigned()]),
  });

  public messages: CustomMessages = {};
}
