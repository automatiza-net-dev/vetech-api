import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import {
  FinanceAccept,
  FinanceOriginFlag,
  FinanceType,
} from 'App/Models/Finance';

export default class UpsertFinanceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    clientId: schema.string([
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    type: schema.enum(Object.values(FinanceType)),
    accountPlanId: schema.string([
      rules.exists({ table: 'account_plans', column: 'id' }),
    ]),
    paymentMethodId: schema.string([
      rules.uuid(),
      rules.exists({ table: 'payment_methods', column: 'id' }),
    ]),
    document: schema.string(),
    historic: schema.string.optional(),
    issueDate: schema.date(),
    expirationDate: schema.date(),
    originalValue: schema.number(),
    accept: schema.enum(Object.values(FinanceAccept)),
    installment: schema.number(),
    originFlag: schema.enum(Object.values(FinanceOriginFlag)),
    qtyInstallments: schema.number(),

    checkingAccountId: schema.string.optional([
      rules.uuid({
        version: '4',
      }),
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
