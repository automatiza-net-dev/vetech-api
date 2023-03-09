import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { PatientGender } from 'App/Models/Patient';
import { TutorResidences } from 'App/Models/PatientTutor';

export default class UpdatePatientWithTutorValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}),
    residence: schema.enum.optional(TutorResidences),
    photo: schema.file.optional({
      extnames: ['jpg', 'gif', 'png'],
    }),
    gender: schema.enum(Object.values(PatientGender), []),
    tags: schema.string({}, []),
    birthDate: schema.date({}),
    active: schema.boolean([]),
    document: schema.string({}, []),
    inscription: schema.string.optional({}, []),
    corporate_name: schema.string.optional({}, []),
    email: schema.string({}, [rules.email()]),
    cellphone: schema.string({}, []),
    telephone: schema.string.optional({}, []),
    message_person_name: schema.string.optional({}, []),
    message_person_phone: schema.string.optional({}, []),
    postal_code: schema.string({}, []),
    street: schema.string({}, []),
    number: schema.string({}, []),
    complement: schema.string.optional({}, []),
    district: schema.string({}, []),
    city: schema.string({}, []),
    state: schema.string({}, []),
    clientOriginId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({ table: 'client_origins', column: 'id' }),
    ]),
    cityCode: schema.string.optional({}),
  });

  public messages: CustomMessages = {};
}
