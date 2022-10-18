import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { MovementCategory, MovementType } from 'App/Models/TaxationGroupRule';

export default class CreateTaxOperationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    code: schema.string(),
    description: schema.string(),
    movementType: schema.enum(Object.values(MovementType)),
    movementCategory: schema.enum(Object.values(MovementCategory)),
    generatesFinancial: schema.boolean(),
    accountingResult: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
