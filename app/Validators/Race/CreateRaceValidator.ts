import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { RaceFur } from 'App/Models/Race';

export default class CreateRaceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    specie_id: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'species', column: 'id' }),
    ]),
    fur: schema.enum(Object.values(RaceFur)),
  });

  public messages: CustomMessages = {};
}
