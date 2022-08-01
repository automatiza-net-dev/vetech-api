import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';

export default class AssignPatientTutorValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    holder: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'patients',
        column: 'id',
      }),
    ]),
    patient: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'patients',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
