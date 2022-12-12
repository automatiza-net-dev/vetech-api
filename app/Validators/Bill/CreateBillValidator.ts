import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateBillValidator {
  constructor(protected ctx: HttpContextContract) { }

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
    productValue: schema.number(),
    serviceValue: schema.number(),
    discountValue: schema.number(),

    otherValue: schema.number.optional(),
    additionalInformation: schema.string.optional(),
    budgetId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'budgets', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
