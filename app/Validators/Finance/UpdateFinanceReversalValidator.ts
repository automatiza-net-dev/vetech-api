import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { FinanceOriginDownFlag } from 'App/Models/Finance';

export default class UpdateFinanceReversalValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    reason: schema.string({ trim: true }),
    originDownFlag: schema.enum(Object.values(FinanceOriginDownFlag)),
  });

  public messages: CustomMessages = {};
}
