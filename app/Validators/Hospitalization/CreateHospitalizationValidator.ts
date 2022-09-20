import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateHospitalizationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({});

  public messages: CustomMessages = {};
}
