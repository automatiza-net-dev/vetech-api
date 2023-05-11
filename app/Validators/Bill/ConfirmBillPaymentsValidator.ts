import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class ConfirmBillPaymentsValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    dailyCashierId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'daily_cashiers', column: 'id' }),
    ]),
    confirmedPayments: schema
      .array()
      .members(
        schema.string({ trim: true }, [
          rules.uuid(),
          rules.exists({ table: 'bill_payments', column: 'id' }),
        ]),
      ),
  });

  public messages: CustomMessages = {};
}
