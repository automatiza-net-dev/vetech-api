import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdatePaymentMethodFlagValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tefAcquirerId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'tef_acquirers', column: 'id' }),
    ]),
    active: schema.boolean(),
    maxInstallments: schema.number.optional(),
    fee: schema.number.optional(),
  });

  public messages: CustomMessages = {};
}
