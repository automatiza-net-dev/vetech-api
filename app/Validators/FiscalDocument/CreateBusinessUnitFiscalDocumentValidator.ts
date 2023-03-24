import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import {
  FiscalDocumentMovementType,
  FiscalDocumentType,
} from 'App/Models/FiscalDocument';

export default class CreateBusinessUnitFiscalDocumentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    fiscalDocumentId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'fiscal_documents', column: 'id' }),
    ]),
    type: schema.enum(Object.values(FiscalDocumentType)),
    movement: schema.enum(Object.values(FiscalDocumentMovementType)),
    description: schema.string(),
    model: schema.string(),
    series: schema.string(),
    sequence: schema.number(),
  });

  public messages: CustomMessages = {};
}
