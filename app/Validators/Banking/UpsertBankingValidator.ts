import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { BankingOriginFlag, BankingType } from 'App/Models/Banking';

export default class UpsertBankingValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    clientId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    type: schema.enum(Object.values(BankingType)),
    accountPlanId: schema.string({ trim: true }, [
      rules.exists({ table: 'account_plans', column: 'id' }),
    ]),
    paymentMethodId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'payment_methods', column: 'id' }),
    ]),
    checkingAccountId: schema.string({ trim: true }, [
      rules.uuid(),
      rules.exists({ table: 'checking_accounts', column: 'id' }),
    ]),
    document: schema.string({ trim: true }),
    historic: schema.string.optional(),
    issueDate: schema.date(),
    documentValue: schema.number(),
    feeValue: schema.number(),
    feePercentage: schema.number(),
    discountValue: schema.number(),
    discountPercentage: schema.number(),
    reconciled: schema.boolean(),
    installment: schema.number(),
    originFlag: schema.enum(Object.values(BankingOriginFlag)),

    observation: schema.string.optional({ trim: true }),
    competenceDate: schema.string.optional({}, [rules.regex(/^\d{2}\/\d{4}$/)]),
    fiscalNote: schema.string.optional({}),
    userDocument: schema.string.optional({ trim: true }),
    nsuDocument: schema.string.optional({ trim: true }),
    barCode: schema.string.optional({ trim: true }),
  });

  public messages: CustomMessages = {};
}
