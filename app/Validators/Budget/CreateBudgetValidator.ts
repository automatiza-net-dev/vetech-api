import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateBudgetValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    sellerId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'users', column: 'id' }),
    ]),
    reviewerId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'users', column: 'id' }),
    ]),
    clientId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    patientId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    dailyMovementId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'daily_movements', column: 'id' }),
    ]),
    attendanceId: schema.number.optional([
      rules.exists({ table: 'attendances', column: 'id' }),
    ]),
    budgetDate: schema.date(),
    expirationDate: schema.date(),
    observation: schema.string.optional(),
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
