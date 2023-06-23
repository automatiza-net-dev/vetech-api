import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import {
  PaymentMethodTef,
  PaymentMethodType,
  PaymentMethodUsage,
} from 'App/Models/PaymentMethod';

export default class UpdatePaymentMethodValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string(),
    requiresDocument: schema.boolean(),
    tef: schema.enum(Object.values(PaymentMethodTef)),
    automaticCancellation: schema.boolean(),
    daysFirstInstallment: schema.number(),
    daysBetweenInstallments: schema.number(),
    allowChangeExpirationDate: schema.boolean(),
    minimumInstallmentValue: schema.number(),
    active: schema.boolean(),
    usage: schema.enum(Object.values(PaymentMethodUsage)),

    type: schema.enum.optional(Object.values(PaymentMethodType)),
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
