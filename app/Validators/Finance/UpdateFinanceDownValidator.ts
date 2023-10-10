import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { FinanceOriginDownFlag } from 'App/Models/Finance';

export default class UpdateFinanceDownValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    items: schema.array().members(
      schema.object().members({
        financeId: schema.string({ trim: true }, [
          rules.uuid(),
          rules.exists({ table: 'finances', column: 'id' }),
        ]),
        checkingAccountId: schema.string({ trim: true }, [
          rules.uuid(),
          rules.exists({ table: 'checking_accounts', column: 'id' }),
        ]),
        paymentDate: schema.date(),
        paymentValue: schema.number(),
        originDownFlag: schema.enum(Object.values(FinanceOriginDownFlag)),
        feeValue: schema.number.optional(),
        feePercentage: schema.number.optional(),
        discountValue: schema.number.optional(),
        discountPercentage: schema.number.optional(),
        increaseValue: schema.number.optional(),
        increasePercentage: schema.number.optional(),

        competenceDate: schema.string.optional({}, [
          rules.regex(/^\d{2}\/\d{4}$/),
        ]),
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
      }),
    ),
  });

  public messages: CustomMessages = {};
}
