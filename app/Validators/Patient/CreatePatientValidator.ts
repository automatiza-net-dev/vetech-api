import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { PatientGender } from 'App/Models/Patient';

export default class CreatePatientValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}),
    photo: schema.file.optional({
      extnames: ['jpg', 'gif', 'png'],
    }),
    gender: schema.enum(Object.values(PatientGender), []),
    tags: schema.string({}, []),
    birthDate: schema.date({}),
    holderId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'patients', column: 'id' }),
    ]),
    raceId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'races', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
