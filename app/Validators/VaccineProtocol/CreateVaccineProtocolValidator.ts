import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateVaccineProtocolValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string(),
    vaccineId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'vaccines', column: 'id' }),
    ]),
    specieId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'species', column: 'id' }),
    ]),
    doses: schema.number([rules.unsigned()]),
    interval: schema.number([rules.unsigned()]),
  });

  public messages: CustomMessages = {};
}
