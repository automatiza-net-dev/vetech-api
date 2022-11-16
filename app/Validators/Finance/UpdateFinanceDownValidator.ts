import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { FinanceOriginDownFlag } from 'App/Models/Finance';

export default class UpdateFinanceDownValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
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
  });

  public messages: CustomMessages = {};
}
