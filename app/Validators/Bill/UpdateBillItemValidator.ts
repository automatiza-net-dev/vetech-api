import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateBillItemValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    items: schema.array().members(
      schema.object().members({
        billItemId: schema.string({ trim: true }, [
          rules.uuid(),
          rules.exists({ table: 'bill_items', column: 'id' }),
        ]),
        discountValue: schema.number(),
      }),
    ),
  });

  public messages: CustomMessages = {};
}
