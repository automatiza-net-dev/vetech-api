import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateProductVariationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    barcode: schema.string.optional({}, []),
    active: schema.boolean([]),
    productId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'products',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
