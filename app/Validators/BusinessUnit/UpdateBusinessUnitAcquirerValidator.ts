import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateBusinessUnitAcquirerValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    document: schema.string({}),
    active: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
