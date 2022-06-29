import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { PatientGender } from 'App/Models/Patient';

export default class CreatePatientWithTutorValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    name: schema.string({}),
    photo: schema.file.optional({
      extnames: ['jpg', 'gif', 'png'],
    }),
    gender: schema.enum(Object.values(PatientGender), []),
    tags: schema.string({}, []),
    birthDate: schema.date({}),
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
  });

  public messages: CustomMessages = {};
}
