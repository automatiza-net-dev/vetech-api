import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateTaxOperationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    code: schema.string(),
    description: schema.string(),
    movementType: schema.string(),
    movementCategory: schema.string(),
    generatesFinancial: schema.boolean(),
    accountingResult: schema.boolean(),
    active: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
