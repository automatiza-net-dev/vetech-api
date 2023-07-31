import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateFinanceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    accountPlanId: schema.string({ trim: true }, [
      rules.exists({ table: 'account_plans', column: 'id' }),
    ]),
    paymentMethodId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'payment_methods', column: 'id' }),
    ]),
    historic: schema.string.optional(),
    originalValue: schema.number(),
    reconciled: schema.boolean(),
    expirationDate: schema.date(),

    checkingAccountId: schema.string.optional({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'checking_accounts', column: 'id' }),
    ]),
    paymentDate: schema.date.optional(),
    downDate: schema.date.optional(),
    paymentValue: schema.number.optional(),
    feeValue: schema.number.optional(),
    feePercentage: schema.number.optional(),
    discountValue: schema.number.optional(),
    discountPercentage: schema.number.optional(),
    increaseValue: schema.number.optional(),
    increasePercentage: schema.number.optional(),
    additionalValue: schema.number.optional(),
    additionalPercentage: schema.number.optional(),
    observation: schema.string.optional({ trim: true }),
    competenceDate: schema.string.optional({}, [rules.regex(/^\d{2}\/\d{4}$/)]),
    fiscalNote: schema.string.optional({}),
    userDocument: schema.string.optional({ trim: true }),
    nsuDocument: schema.string.optional({ trim: true }),
    barCode: schema.string.optional({ trim: true }),
    bank: schema.string.optional({ trim: true }),
    agency: schema.string.optional({ trim: true }),
    account: schema.string.optional({ trim: true }),
    tefAcquirerId: schema.string.optional({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'tef_acquirers', column: 'id' }),
    ]),
    tefFlagId: schema.string.optional({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'tef_flags', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
