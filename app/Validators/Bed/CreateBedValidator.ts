import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, schema } from '@ioc:Adonis/Core/Validator';
import { BedType } from 'App/Models/Bed';

export default class CreateBedValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string(),
    tag: schema.string(),
    type: schema.enum(Object.values(BedType)),
  });

  public messages: CustomMessages = {};
}
