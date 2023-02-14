import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { PatientGender } from 'App/Models/Patient';

export default class FastCreatePatientValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    tutorName: schema.string({}),
    tutorEmail: schema.string({}, [rules.email()]),
    tutorPhone: schema.string({}),

    patientName: schema.string({}),
    patientRaceId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'races',
        column: 'id',
      }),
    ]),
    patientGender: schema.enum(Object.values(PatientGender), []),
  });

  public messages: CustomMessages = {};
}
