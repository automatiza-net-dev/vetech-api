import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateAnimalVaccineValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tag: schema.string({}, [rules.uuid()]),
    name: schema.string({}, []),
    description: schema.string({}, []),
    observation: schema.string.optional({}, []),
  });

  public messages: CustomMessages = {};
}
