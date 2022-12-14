import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateBudgetValidator {
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
    budgetDate: schema.date(),
    expirationDate: schema.date(),
    observation: schema.string(),
    items: schema.array().members(
      schema.object().members({
        productVariationId: schema.string({}, [
          rules.uuid(),
          rules.exists({ table: 'product_variations', column: 'id' }),
        ]),
        quantity: schema.number(),
        unitaryValue: schema.number(),
        discountValue: schema.number(),
      }),
    ),
  });

  public messages: CustomMessages = {};
}
