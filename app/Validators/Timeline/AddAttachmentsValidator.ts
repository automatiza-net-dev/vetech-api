import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class AddAttachmentsValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    files: schema.array().members(schema.file({})),
  });

  public messages: CustomMessages = {};
}
