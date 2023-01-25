import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import {
  FiscalDocumentMovementType,
  FiscalDocumentType,
} from 'App/Models/FiscalDocument';

export default class CreateBusinessUnitFiscalDocumentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    type: schema.enum(Object.values(FiscalDocumentType)),
    movement: schema.enum(Object.values(FiscalDocumentMovementType)),
    description: schema.string(),
    model: schema.string(),
    series: schema.string(),
    sequence: schema.number(),
  });

  public messages: CustomMessages = {};
}
