import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateAnimalObservationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tag: schema.string({}, [rules.uuid()]),
    technicianId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'users',
        column: 'id',
      }),
    ]),
    medias: schema.array.optional().members(schema.file({})),
    observation: schema.string({}, []),
    resume: schema.string.optional({}, []),
    createdAt: schema.date.optional({}, []),
  });

  public messages: CustomMessages = {};
}
