import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateBillItemValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    billId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'bills', column: 'id' }),
    ]),
    productVariationId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'product_variations', column: 'id' }),
    ]),
    taxationGroupRuleId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'taxation_group_rules', column: 'id' }),
    ]),
    quantity: schema.number(),
    costValue: schema.number(),
    saleValue: schema.number(),
    unitaryValue: schema.number(),
    discountValue: schema.number(),
  });

  public messages: CustomMessages = {};
}
