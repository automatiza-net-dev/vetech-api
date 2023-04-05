import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateProductVariationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    barcode: schema.string({}, []),
    productId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'products',
        column: 'id',
      }),
    ]),
    options: schema.array().members(
      schema.string({}, [
        rules.uuid(),
        rules.exists({
          table: 'variation_options',
          column: 'id',
        }),
      ]),
    ),
  });

  public messages: CustomMessages = {};
}
