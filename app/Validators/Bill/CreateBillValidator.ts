import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateBillValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    clientId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    patientId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    dailyMovementId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'daily_movements', column: 'id' }),
    ]),
    dailyCashierId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'daily_cashiers', column: 'id' }),
    ]),
    billDate: schema.date(),

    additionalInformation: schema.string.optional(),
    budgetId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'budgets', column: 'id' }),
    ]),

    items: schema.array().members(
      schema.object().members({
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
      }),
    ),
  });

  public messages: CustomMessages = {};
}
