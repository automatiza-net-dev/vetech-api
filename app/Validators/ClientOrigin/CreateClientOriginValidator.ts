import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { ClientOriginType } from 'App/Models/ClientOrigin';

export default class CreateClientOriginValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    type: schema.enum(Object.values(ClientOriginType)),
    description: schema.string(),
  });

  public messages: CustomMessages = {};
}
