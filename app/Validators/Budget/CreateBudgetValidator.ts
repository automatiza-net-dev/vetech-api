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
    dailyCashierId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'daily_cashiers', column: 'id' }),
    ]),
    budgetDate: schema.date(),
    expirationDate: schema.date(),
    productValue: schema.number(),
    serviceValue: schema.number(),
    discountValue: schema.number(),
    observation: schema.string(),
  });

  public messages: CustomMessages = {};
}
