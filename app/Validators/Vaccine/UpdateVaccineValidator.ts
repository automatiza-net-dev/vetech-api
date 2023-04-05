import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { VaccineType } from 'App/Models/Vaccine';

export default class UpdateVaccineValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    subgroupId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'subgroups',
        column: 'id',
      }),
    ]),
    name: schema.string({}, []),
    description: schema.string({}, []),
    active: schema.boolean([]),
    type: schema.enum(Object.values(VaccineType), []),
  });

  public messages: CustomMessages = {};
}
