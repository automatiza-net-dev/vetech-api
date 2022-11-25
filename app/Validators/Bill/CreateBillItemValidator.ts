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
    quantity: schema.number([rules.range(1, 999999)]),
    costValue: schema.number([rules.range(0.01, 999999)]),
    saleValue: schema.number([rules.range(0.01, 999999)]),
    unitaryValue: schema.number([rules.range(0.01, 999999)]),
    discountValue: schema.number([rules.range(0.01, 999999)]),
  });

  public messages: CustomMessages = {};
}
