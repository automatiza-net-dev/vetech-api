import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpdateRaceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    specie_id: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'species', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
