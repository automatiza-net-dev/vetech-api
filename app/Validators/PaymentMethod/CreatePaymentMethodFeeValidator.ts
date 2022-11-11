import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreatePaymentMethodFeeValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    paymentMethodId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'payment_methods', column: 'id' }),
    ]),
    paymentMethodFlagId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'payment_method_flags', column: 'id' }),
    ]),
    installments: schema.number(),
    fee: schema.number(),
  });

  public messages: CustomMessages = {};
}
