import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateAnimalWeightValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tag: schema.string({}, [rules.uuid()]),
    weight: schema.number([rules.unsigned()]),
    realizedAt: schema.date({}),
    technicianId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'users',
        column: 'id',
      }),
    ]),
    observation: schema.string({}, []),
  });

  public messages: CustomMessages = {};
}
