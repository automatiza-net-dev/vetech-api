import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema, rules } from '@ioc:Adonis/Core/Validator';

export default class CreateCashierExpenseValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    entryDate: schema.date(),
    description: schema.string(),
    value: schema.number(),

    paymentMethodId: schema.string({}, [
      rules.exists({ table: 'payment_methods', column: 'id' }),
    ]),
    accountPlanId: schema.string({}, [
      rules.exists({ table: 'account_plans', column: 'id' }),
    ]),
    fiscalNote: schema.string(),
  });

  public messages: CustomMessages = {};
}
