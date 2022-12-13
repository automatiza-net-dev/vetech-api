import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateBillPaymentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    billId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'bills', column: 'id' }),
    ]),
    paymentMethodId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'payment_methods', column: 'id' }),
    ]),
    acquirerId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'tef_acquirers', column: 'id' }),
    ]),
    flagId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'tef_flags', column: 'id' }),
    ]),
    expirationDate: schema.date(),
    installmentsValue: schema.number([rules.unsigned()]),
    installments: schema.number([rules.unsigned()]),
  });

  public messages: CustomMessages = {};
}
