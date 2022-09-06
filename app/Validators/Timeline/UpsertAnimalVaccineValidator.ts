import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class UpsertAnimalVaccineValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tag: schema.string({}, [rules.uuid()]),
    name: schema.string({}, []),
    technicianId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'users',
        column: 'id',
      }),
    ]),
    expectedDate: schema.date.optional({}, []),
    applicationDate: schema.date.optional({}, []),
    laboratory: schema.string.optional({}, []),
    batch: schema.string.optional({}, []),
  });

  public messages: CustomMessages = {};
}
