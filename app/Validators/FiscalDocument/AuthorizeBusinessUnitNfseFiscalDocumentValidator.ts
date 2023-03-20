import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class AuthorizeBusinessUnitNfseFiscalDocumentValidator {
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
  });

  public messages: CustomMessages = {};
}
