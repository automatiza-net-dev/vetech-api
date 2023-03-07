import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdatePaymentMethodFlagInstallmentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    fee: schema.number(),
  });

  public messages: CustomMessages = {};
}
