import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { BusinessUnitFiscalDocumentMovementType } from 'App/Models/BusinessUnitFiscalDocument';

export default class AuthorizeBusinessUnitFiscalDocumentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    billId: schema.string([
      rules.uuid(),
      rules.exists({
        table: 'bills',
        column: 'id',
      }),
    ]),
    unitFiscalDocumentId: schema.string([
      rules.uuid(),
      rules.exists({
        table: 'business_unit_fiscal_documents',
        column: 'id',
      }),
    ]),
    type: schema.enum(Object.values(BusinessUnitFiscalDocumentMovementType)),
    accessKeyRef: schema.string(),
  });

  public messages: CustomMessages = {};
}
