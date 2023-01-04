import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { PatientGender, PatientVaccineOrigin } from 'App/Models/Patient';

export default class CreatePatientValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}),
    photo: schema.file.optional({
      extnames: ['jpg', 'gif', 'png'],
    }),
    gender: schema.enum.optional(Object.values(PatientGender), []),
    tags: schema.string.optional({}, []),
    birthDate: schema.date.optional({}),
    holderId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    raceId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'races', column: 'id' }),
    ]),
    vaccineOrigin: schema.enum.optional(
      Object.values(PatientVaccineOrigin),
      [],
    ),
  });

  public messages: CustomMessages = {};
}
