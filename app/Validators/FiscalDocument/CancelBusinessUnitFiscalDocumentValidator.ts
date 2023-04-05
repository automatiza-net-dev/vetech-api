import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CancelBusinessUnitFiscalDocumentValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    issuedDocumentId: schema.string([
      rules.uuid(),
      rules.exists({
        table: 'issued_fiscal_documents',
        column: 'id',
      }),
    ]),
    reason: schema.string(),
  });

  public messages: CustomMessages = {};
}
