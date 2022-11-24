import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateBudgetItemValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    quantity: schema.number(),
    unitaryValue: schema.number(),
    discountValue: schema.number(),
  });

  public messages: CustomMessages = {};
}
