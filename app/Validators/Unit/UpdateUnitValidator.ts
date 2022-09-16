import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { UnitType } from 'App/Models/Unit';

export default class UpdateUnitValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({ trim: true }, [rules.maxLength(255)]),
    tag: schema.string({ trim: true }, [rules.maxLength(255)]),
    type: schema.enum(Object.values(UnitType)),
    active: schema.boolean(),
  });

  public messages: CustomMessages = {};
}
