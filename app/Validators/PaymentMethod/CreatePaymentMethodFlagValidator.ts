import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreatePaymentMethodFlagValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    paymentMethodId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'payment_methods', column: 'id' }),
    ]),
    tefFlagId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'tef_flags', column: 'id' }),
    ]),
    tefAcquirerId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'tef_acquirers', column: 'id' }),
    ]),
    checkingAccountId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'checking_accounts', column: 'id' }),
    ]),
    maxInstallments: schema.number.optional(),
  });

  public messages: CustomMessages = {};
}
