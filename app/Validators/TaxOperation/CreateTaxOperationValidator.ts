import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateTaxOperationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    code: schema.string(),
    description: schema.string(),
    movementType: schema.string(),
    movementCategory: schema.string(),
    generatesFinancial: schema.boolean(),
    financialTrouble: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
