import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateAnimalVaccineValidator {
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
    expectedDate: schema.date({}, []),
    applicationDate: schema.date({}, []),
    laboratory: schema.string({}, []),
    batch: schema.string({}, []),
  });

  public messages: CustomMessages = {};
}
