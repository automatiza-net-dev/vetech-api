import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { PaymentMethodTef, PaymentMethodType } from 'App/Models/PaymentMethod';

export default class CreatePaymentMethodValidator {
  constructor(protected ctx: HttpContextContract) {}

  private tef = this.ctx.request.input('tef');

  public schema = schema.create({
    description: schema.string(),
    requiresDocument: schema.boolean(),
    tef: schema.enum(Object.values(PaymentMethodTef)),
    automaticCancellation: schema.boolean(),
    daysFirstInstallment: schema.number(),
    daysBetweenInstallments: schema.number(),
    allowChangeExpirationDate: schema.boolean(),
    minimumInstallmentValue: schema.number(),
    type:
      this.tef === PaymentMethodTef.N
        ? schema.enum.optional(Object.values(PaymentMethodType))
        : schema.enum(Object.values(PaymentMethodType)),
    checkingAccountId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'checking_accounts', column: 'id' }),
    ]),
    fee: schema.number.optional(),
    daysUntilTransfer: schema.number.optional(),
    installmentsWithoutPassword: schema.number.optional(),
    maxInstallments: schema.number.optional(),
  });

  public messages: CustomMessages = {};
}
