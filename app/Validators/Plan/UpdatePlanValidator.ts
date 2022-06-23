import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdatePlanValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}),
    trialDays: schema.number([rules.unsigned()]),
    trialAdditional: schema.number([rules.unsigned()]),
    default: schema.boolean([]),
  });

  public messages: CustomMessages = {};
}
