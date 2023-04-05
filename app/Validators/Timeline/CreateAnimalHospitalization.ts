import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class CreateAnimalHospitalizationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tag: schema.string({}, [rules.uuid()]),
    situation: schema.string({}, []),
    box: schema.string({}, []),
    risk: schema.string({}, []),
    complaint: schema.string({}, []),
    diagnosis: schema.string({}, []),
    prognosis: schema.string({}, []),
    expectedDate: schema.date({}),
    technicianId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'users',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
