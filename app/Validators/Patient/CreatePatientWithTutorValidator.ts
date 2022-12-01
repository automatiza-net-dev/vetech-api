import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { PatientGender } from 'App/Models/Patient';
import { TutorResidences } from 'App/Models/PatientTutor';

export default class CreatePatientWithTutorValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}),
    residence: schema.enum(TutorResidences),
    photo: schema.file.optional({
      extnames: ['jpg', 'gif', 'png'],
    }),
    gender: schema.enum.optional(Object.values(PatientGender), []),
    tags: schema.string.optional({}, []),
    birthDate: schema.date.optional({}),
    document: schema.string.optional({}, []),
    inscription: schema.string.optional({}, []),
    corporate_name: schema.string.optional({}, []),
    email: schema.string({}, [rules.email()]),
    cellphone: schema.string({}, []),
    telephone: schema.string.optional({}, []),
    message_person_name: schema.string.optional({}, []),
    message_person_phone: schema.string.optional({}, []),
    postal_code: schema.string.optional({}, []),
    street: schema.string.optional({}, []),
    number: schema.string.optional({}, []),
    complement: schema.string.optional({}, []),
    district: schema.string.optional({}, []),
    city: schema.string.optional({}, []),
    state: schema.string.optional({}, []),
    clientOriginId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'client_origins', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
